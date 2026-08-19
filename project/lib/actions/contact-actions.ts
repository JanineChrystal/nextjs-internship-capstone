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
 * The public contact endpoint.
 *
 * This is the only server action in the app that anyone on the internet can call
 * without an account, so the three things a session would normally provide -
 * identity, authorisation and a natural rate limit - all have to be replaced
 * explicitly:
 *
 *   1. the schema is re-run here, never trusted from the browser
 *   2. the honeypot is checked here, for the same reason
 *   3. requests are rate limited per IP
 *
 * It returns { success, error } like every other action rather than throwing, so
 * the drawer can show a message instead of an error boundary.
 */

const MAX_SUBMISSIONS_MESSAGE =
	"Too many messages from this connection. Please try again in a minute.";

/**
 * The caller's IP, as far as it can be known behind a proxy.
 *
 * `x-forwarded-for` is a list, oldest first, and only the last entry is added by
 * infrastructure we control - but Vercel rewrites the header so the first entry
 * is the real client. Falling back to a constant when nothing is present means
 * an unidentifiable caller shares one bucket with every other unidentifiable
 * caller, which is the strict direction rather than the lenient one.
 */
async function resolveClientIp(): Promise<string> {
	const headerList = await headers();
	const forwarded = headerList.get("x-forwarded-for");
	if (forwarded) return forwarded.split(",")[0].trim();
	return headerList.get("x-real-ip") ?? "unknown";
}

/**
 * Applies the shared sliding-window limiter, and fails open if it is
 * unreachable.
 *
 * The limiter is imported lazily inside the try so that a missing Upstash
 * environment variable degrades spam protection instead of crashing the build -
 * `lib/rate-limit.ts` throws at module scope, and a static import would make the
 * public landing page unbuildable on a deployment that forgot one variable.
 *
 * Failing open is the right direction here: losing a real enquiry is worse than
 * accepting one extra message from someone who was going to be blocked.
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
 * Announces a saved message on every configured channel, then stamps the row.
 *
 * ## Why this runs in `after()` and not inline
 *
 *     inline await                        after()
 *     ─────────────────────────────       ─────────────────────────────
 *     save row                            save row
 *     await Resend      (up to 8s)        respond "sent"  ← user is done
 *     await Telegram    (up to 8s)        ...response flushed...
 *     respond "sent"    ← after 16s       Resend + Telegram in parallel
 *                                         stamp notifiedAt
 *
 * The sender is waiting on a spinner, and nothing they need depends on the
 * alert: their message is already in the database. `after()` is Next's primitive
 * for exactly this - work that must happen but must not delay the response - and
 * unlike a bare floating promise it keeps the serverless invocation alive until
 * the work finishes, so the alert is not killed when the function freezes.
 *
 * Everything in here is wrapped so nothing can escape. By the time this runs the
 * response has already been sent; a thrown error here has nowhere to go and
 * would only surface as an unhandled rejection in the logs.
 */
function scheduleNotification(notification: ContactNotification): void {
	after(async () => {
		try {
			const outcomes = await deliverContactNotification(notification);

			// Stamped only when a channel actually delivered. A row left unstamped
			// after an outage is the list of people nobody has seen yet, which is
			// only useful if "we tried" and "it arrived" are not conflated.
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

		// The honeypot, checked server-side. A bot that filled it is told the
		// message was sent - reporting the rejection would tell whoever wrote the
		// bot exactly which field gave them away, and the next attempt would leave
		// it blank. Nothing is written and nothing is announced.
		if (parsed.data.website) return { success: true };

		const ip = await resolveClientIp();
		if (!(await isWithinRateLimit(ip))) {
			return { success: false, error: MAX_SUBMISSIONS_MESSAGE };
		}

		const saved = await createContactMessageDAL({
			name: parsed.data.name,
			email: parsed.data.email,
			// An empty optional field is stored as NULL rather than "". One absent
			// value with one representation is what keeps a later "has an
			// organisation" query from having to know about both.
			organization: parsed.data.organization?.trim() || null,
			topic: parsed.data.topic,
			message: parsed.data.message,
		});

		// Built from the saved row, not from the form values, so the alert can only
		// ever describe something that is genuinely in the database - and so it
		// carries the row id, which is what lets you find the message again from a
		// Telegram notification on your phone.
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
