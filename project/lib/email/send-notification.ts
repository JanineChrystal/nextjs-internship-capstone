import "server-only";
import { render } from "@react-email/render";
import type { ReactElement } from "react";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const NOTIFIER_TIMEOUT_MS = 10000;

interface SendNotificationOptions {
	/** The email address to send to */
	to: string;
	/** The subject of the email */
	subject: string;
	/** The React Email component to render */
	template: ReactElement;
	/**
	 * Whether this recipient's preferences allow the email.
	 *
	 * Supplied by the caller from `recordActivity`, which gets it from
	 * `createNotificationDAL` - the one place that reads a settings row. This
	 * function used to look the preference up itself, which meant two
	 * implementations of the same rule, and the one that ran was not the one that
	 * looked authoritative.
	 *
	 * An invited address with no account yet passes `true`: there is no settings
	 * row to consult, and someone being invited has not had the chance to opt out
	 * of the message that tells them they were invited.
	 */
	shouldSend: boolean;
	/** Optional reply-to address */
	replyTo?: string;
}

/**
 * Sends one notification email through Resend.
 *
 * Uses pure fetch rather than the SDK, matching the existing ResendNotifier.
 * Never throws: the caller has already completed the thing this email is about,
 * and a mail failure must not undo it.
 */
export async function sendNotification({
	to,
	subject,
	template,
	shouldSend,
	replyTo,
}: SendNotificationOptions): Promise<boolean> {
	if (!shouldSend) return false;

	// 1. Check if we have an API key and sending address
	const apiKey = process.env.RESEND_API_KEY;
	const from = process.env.CONTACT_EMAIL_FROM;

	if (!apiKey || !from) {
		console.warn("Skipping email notification: Resend is not configured.");
		return false;
	}

	// 2. Render the email
	let html: string;
	try {
		html = await render(template);
	} catch (error) {
		console.error("Failed to render React Email template:", error);
		return false;
	}

	// 3. Send using pure fetch (matching ResendNotifier)
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
