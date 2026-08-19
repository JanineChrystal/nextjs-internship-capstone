import type { ContactTopic } from "@/lib/validations/contact-schema";

/**
 * What a contact notifier is handed.
 *
 * Built from the stored row rather than from the form values, so a notifier can
 * only ever announce something that was actually saved - and so the alert can
 * carry the row's id, which is what makes it possible to find the message again
 * in the database from a Telegram message on your phone.
 */
export interface ContactNotification {
	id: string;
	name: string;
	email: string;
	organization: string | null;
	topic: ContactTopic;
	message: string;
	receivedAt: Date;
}

/**
 * One way of announcing that a contact message arrived.
 *
 * ## Why this is an interface with two implementations
 *
 * This is the same shape the profanity detector will take in Phase 6, and it is
 * where object-oriented design actually earns its place in this codebase rather
 * than being applied for its own sake. Email and Telegram have nothing in common
 * internally - one posts to Resend with an HTML body, the other posts to the
 * Telegram Bot API with its own markup dialect and a length cap - but the caller
 * needs exactly one thing from both: "announce this, and tell me if you could
 * not."
 *
 * Writing that as one function with an `if (channel === "email")` inside would
 * mean every future channel edits the same function, and every caller of it
 * re-asks which channel it is dealing with. Behind this interface, adding Slack
 * later is a new file and one line in the registry - no existing file changes.
 * That is the open/closed principle doing real work, and it is what a panel will
 * ask about.
 *
 * `isConfigured()` is on the interface, not inferred by the registry, because
 * only the notifier knows which environment variables it needs. The registry
 * asking "do you have what you need?" keeps that knowledge in one place per
 * channel and is what lets the app run perfectly well with neither key set.
 */
export interface ContactNotifier {
	/** Used in logs and in the delivery outcome. */
	readonly channel: string;

	/** False when this channel's environment variables are absent. */
	isConfigured(): boolean;

	/** Throws on failure. The registry is what decides that is survivable. */
	deliver(notification: ContactNotification): Promise<void>;
}

export type DeliveryStatus = "delivered" | "skipped" | "failed";

export interface DeliveryOutcome {
	channel: string;
	status: DeliveryStatus;
	/** Present only when the status is "failed". */
	error?: string;
}
