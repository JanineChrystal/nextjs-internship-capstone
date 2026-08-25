import type { ContactTopic } from "@/lib/validations/contact-schema";

/**
 * contact notification - represents a received contact message shaped directly
 * from the database row, allowing notifiers to alert with a permanent record ID.
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
 * contact notifier - defines a common interface for disparate notification
 * channels (e.g. Email, Telegram), utilizing polymorphism to isolate channel
 * logic and configuration requirements from the caller.
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
