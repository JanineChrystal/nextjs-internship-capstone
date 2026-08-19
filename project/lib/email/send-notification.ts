import "server-only";
import { render } from "@react-email/render";
import { getUserNotificationSettingsForWorkerDAL } from "@/lib/dal/notification-settings";
import type { NotificationSettingKey } from "@/lib/types/notification-settings";
import type { ReactElement } from "react";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const NOTIFIER_TIMEOUT_MS = 10000;

interface SendNotificationOptions {
	/** The ID of the user receiving the notification */
	userId: string;
	/** The email address to send to */
	to: string;
	/** The subject of the email */
	subject: string;
	/** The React Email component to render */
	template: ReactElement;
	/** The type of notification to check preferences against */
	type: NotificationSettingKey;
	/** Optional reply-to address */
	replyTo?: string;
}

/**
 * Checks a user's notification preferences and sends an email if they have it enabled.
 * Uses Resend via pure fetch to avoid SDK dependencies, matching the existing ResendNotifier.
 */
export async function sendNotification({
	userId,
	to,
	subject,
	template,
	type,
	replyTo,
}: SendNotificationOptions): Promise<boolean> {
	// 1. Check if we have an API key and sending address
	const apiKey = process.env.RESEND_API_KEY;
	const from = process.env.CONTACT_EMAIL_FROM;

	if (!apiKey || !from) {
		console.warn("Skipping email notification: Resend is not configured.");
		return false;
	}

	// 2. Check user preferences (skip if it's a pending user invite)
	if (userId !== "pending-user") {
		try {
			const preferences = await getUserNotificationSettingsForWorkerDAL(userId);
			if (!preferences[type]) {
				console.info(`Skipping notification: user disabled ${type}`);
				return false;
			}
		} catch (error) {
			console.error("Failed to check preferences, defaulting to false:", error);
			return false;
		}
	}

	// 3. Render the email
	let html: string;
	try {
		html = await render(template);
	} catch (error) {
		console.error("Failed to render React Email template:", error);
		return false;
	}

	// 4. Send using pure fetch (matching ResendNotifier)
	try {
		const response = await fetch(RESEND_ENDPOINT, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				from,
				to: [to],
				subject,
				reply_to: replyTo,
				html,
			}),
			signal: AbortSignal.timeout(NOTIFIER_TIMEOUT_MS),
		});

		if (!response.ok) {
			const detail = await response.text().catch(() => "");
			throw new Error(`Resend responded ${response.status}: ${detail}`);
		}

		return true;
	} catch (error) {
		console.error("Failed to send notification via Resend:", error);
		return false;
	}
}
