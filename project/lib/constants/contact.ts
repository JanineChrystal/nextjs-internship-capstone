import type { ContactTopic } from "@/lib/validations/contact-schema";

/**
 * contact topic labels - centralizes the human-readable labels for
 * contact topics to ensure consistency across the frontend form,
 * email subject lines, and server-side notifications.
 */
export const CONTACT_TOPIC_LABELS: Record<ContactTopic, string> = {
	general: "General question",
	demo: "Request a walkthrough",
	support: "Help with my account",
	partnership: "Partnership or pilot",
};

/**
 * notifier timeout ms - enforces a strict execution time limit on
 * notification deliveries to prevent slow providers from exhausting
 * serverless function limits or increasing costs.
 */
export const NOTIFIER_TIMEOUT_MS = 8000;

/**
 * telegram max length - sets a hard character limit slightly below
 * telegram's threshold to ensure message delivery and prevent silent
 * rejections caused by oversized headers.
 */
export const TELEGRAM_MAX_LENGTH = 4000;
