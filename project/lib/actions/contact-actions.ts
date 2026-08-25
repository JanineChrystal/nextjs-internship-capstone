"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import {
	createContactMessageDAL,
	markContactMessageNotifiedDAL,
} from "@/lib/dal/contact";
import {
	deliverContactNotification,
	wasNotificationDelivered,
} from "@/lib/notifiers";
import type { ContactNotification } from "@/lib/types/notifier";
import {
	type ContactMessageFormValues,
	ContactMessageSchema,
} from "@/lib/validations/contact-schema";

/**
 * public contact endpoint - handles unauthenticated submissions
 * with explicit server-side validation, honeypot checking, and
 * IP-based rate limiting.
 */

const MAX_SUBMISSIONS_MESSAGE =
	"Too many messages from this connection. Please try again in a minute.";

/**
 * client ip resolution - extracts the true client IP from proxy
 * headers, falling back to a shared constant for strict rate
 * limiting of unknown callers.
 */
async function resolveClientIp(): Promise<string> {
	const headerList = await headers();
	const forwarded = headerList.get("x-forwarded-for");
	if (forwarded) return forwarded.split(",")[0].trim();
	return headerList.get("x-real-ip") ?? "unknown";
}

/**
 * fail-open rate limiting - dynamically imports and applies rate
 * limits, failing open to ensure valid inquiries are not lost if
 * the rate limiter is unavailable.
 */
async function isWithinRateLimit(identifier: string): Promise<boolean> {
	try {
		const { actionRateLimiter } = await import("@/lib/rate-limit");
		const { success } = await actionRateLimiter.limit(`contact:${identifier}`);
		return success;
	} catch (error) {
		console.error("Contact rate limiter unavailable:", error);
		return true;
	}
}

/**
 * deferred notification - uses Next's after() to dispatch
 * notifications asynchronously after responding to the user,
 * preventing long waits while ensuring background tasks complete.
 */
function scheduleNotification(notification: ContactNotification): void {
	after(async () => {
		try {
			const outcomes = await deliverContactNotification(notification);

			/**
			 * selective stamping - only marks rows as notified if delivery
			 * succeeded on at least one channel, preserving unnotified status
			 * during outages.
			 */
			if (wasNotificationDelivered(outcomes)) {
				await markContactMessageNotifiedDAL(notification.id);
			}

			console.info(
				`Contact ${notification.id} notification:`,
				outcomes
					.map((outcome) => `${outcome.channel}=${outcome.status}`)
					.join(" "),
			);
		} catch (error) {
			console.error("Contact notification stage failed:", error);
		}
	});
}

export async function submitContactMessageAction(
	values: ContactMessageFormValues,
): Promise<{ success: boolean; error?: string }> {
	try {
		const parsed = ContactMessageSchema.safeParse(values);

		if (!parsed.success) {
			return {
				success: false,
				error:
					parsed.error.issues[0]?.message ?? "Please check the form and retry",
			};
		}

		/**
		 * silent honeypot rejection - quietly drops bot submissions that
		 * fill the honeypot field while returning success to deceive
		 * automated scripts.
		 */
		if (parsed.data.website) return { success: true };

		const ip = await resolveClientIp();
		if (!(await isWithinRateLimit(ip))) {
			return { success: false, error: MAX_SUBMISSIONS_MESSAGE };
		}

		const saved = await createContactMessageDAL({
			name: parsed.data.name,
			email: parsed.data.email,
			/**
			 * null normalization - stores empty optional fields as NULL instead
			 * of empty strings to simplify subsequent queries.
			 */
			organization: parsed.data.organization?.trim() || null,
			topic: parsed.data.topic,
			message: parsed.data.message,
		});

		/**
		 * verified notification payload - constructs the alert payload
		 * using the saved database row to guarantee data integrity and
		 * include the generated row ID.
		 */
		scheduleNotification({
			id: saved.id,
			name: saved.name,
			email: saved.email,
			organization: saved.organization,
			topic: parsed.data.topic,
			message: saved.message,
			receivedAt: saved.createdAt,
		});

		return { success: true };
	} catch (error) {
		console.error("submitContactMessageAction error:", error);
		return {
			success: false,
			error: "Could not send your message. Please try again.",
		};
	}
}
