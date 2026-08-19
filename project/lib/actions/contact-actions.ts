"use server";

import { headers } from "next/headers";
import { createContactMessageDAL } from "@/lib/dal/contact";
import {
	type ContactMessageFormValues,
	ContactMessageSchema,
} from "@/lib/validations/contact-schema";

/**
 * The public contact endpoint.
 *
 * This is the only server action in the app that anyone on the internet can
 * call without an account, so the three things a session would normally provide
 * - identity, authorisation and a natural rate limit - all have to be replaced
 * explicitly:
 *
 *   1. the schema is re-run here, never trusted from the browser
 *   2. the honeypot is checked here, for the same reason
 *   3. requests are rate limited per IP
 *
 * It returns { success, error } like every other action rather than throwing,
 * so the drawer can show a message instead of an error boundary.
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
 * Failing open is the right direction here for the same reason it is for the
 * profanity API: losing a real enquiry is worse than accepting one extra
 * message from someone who was going to be blocked.
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
		// it blank.
		if (parsed.data.website) return { success: true };

		const ip = await resolveClientIp();
		if (!(await isWithinRateLimit(ip))) {
			return { success: false, error: MAX_SUBMISSIONS_MESSAGE };
		}

		await createContactMessageDAL({
			name: parsed.data.name,
			email: parsed.data.email,
			// An empty optional field is stored as NULL rather than "". One absent
			// value with one representation is what keeps a later "has an
			// organisation" query from having to know about both.
			organization: parsed.data.organization?.trim() || null,
			topic: parsed.data.topic,
			message: parsed.data.message,
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
