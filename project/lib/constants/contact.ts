import type { ContactTopic } from "@/lib/validations/contact-schema";

/**
 * The human label for each contact topic.
 *
 * This lives in lib/constants rather than beside the landing page because three
 * different things now need it: the form's dropdown, the subject line of the
 * notification email, and the Telegram alert. Two of those run on the server and
 * cannot reasonably import out of `app/(public)/_constants`, and if they each
 * kept their own copy the email would eventually say "demo" while the form said
 * "Request a walkthrough".
 */
export const CONTACT_TOPIC_LABELS: Record<ContactTopic, string> = {
	general: "General question",
	demo: "Request a walkthrough",
	support: "Help with my account",
	partnership: "Partnership or pilot",
};

/**
 * How long a delivery attempt may take before it is abandoned.
 *
 * Deliberately short. The message is already saved by the time these run, so a
 * slow provider must never be allowed to hold a serverless invocation open -
 * that costs money and, on a platform with an execution ceiling, eventually gets
 * the function killed mid-flight with no record of why.
 */
export const NOTIFIER_TIMEOUT_MS = 8000;

/**
 * Telegram rejects any message over 4096 characters outright. The form already
 * caps a message at 2000, so this only ever bites if the header grows - but a
 * silent rejection of the alert is exactly the failure nobody notices, so the
 * body is truncated rather than trusted to fit.
 */
export const TELEGRAM_MAX_LENGTH = 4000;
