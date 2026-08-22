import "server-only";
import type {
	ContactNotification,
	ContactNotifier,
	DeliveryOutcome,
} from "@/lib/types/notifier";
import { SendGridNotifier } from "./sendgrid-notifier";
import { TelegramNotifier } from "./telegram-notifier";

/**
 * The channels a contact message is announced on.
 *
 * Adding one is a new file implementing ContactNotifier plus a line in this
 * array. Nothing else in the codebase changes - not the action, not the DAL, not
 * the form. That is the payoff for the interface, and it is worth stating
 * plainly because the alternative (an if/else chain inside the action) looks
 * shorter right up until the third channel.
 *
 * Order matters only for the log: the outcomes come back in this order.
 */
const NOTIFIERS: ContactNotifier[] = [
	new SendGridNotifier(),
	new TelegramNotifier(),
];

/**
 * Announces one contact message on every configured channel.
 *
 * ## Three things this deliberately does NOT do
 *
 * **It does not throw.** The message is already saved by the time this runs. A
 * failed alert is a problem for whoever runs the inbox, never for the person who
 * filled in the form - telling them "could not send" about a message that is
 * safely in the database would be a lie that makes them submit it again.
 *
 * **It does not stop at the first failure.** `Promise.allSettled`, not
 * `Promise.all`: the two channels are independent, and SendGrid being down is not
 * a reason to skip the Telegram alert that would have reached you anyway. With
 * `Promise.all` one rejection would abandon the other channel's result even
 * though its request had already been sent.
 *
 * **It does not retry.** A retry queue means a worker, a backoff policy and a
 * dead-letter table - real infrastructure for a problem that has not happened.
 * The row is in the database either way, and the returned outcomes say which
 * channel failed, which is enough to notice and enough to fix by hand.
 *
 * @returns one outcome per channel, for logging and for deciding whether the row
 *          can be stamped as notified.
 */
export async function deliverContactNotification(
	notification: ContactNotification,
): Promise<DeliveryOutcome[]> {
	const results = await Promise.allSettled(
		NOTIFIERS.map(async (notifier): Promise<DeliveryOutcome> => {
			// An unconfigured channel is "skipped", not "failed". The difference
			// matters: skipped means nobody has added the key yet, failed means the
			// key is there and something is wrong with it. Collapsing them into one
			// state is how a broken integration hides behind "not set up".
			if (!notifier.isConfigured()) {
				return { channel: notifier.channel, status: "skipped" };
			}

			await notifier.deliver(notification);
			return { channel: notifier.channel, status: "delivered" };
		}),
	);

	return results.map((result, index) => {
		if (result.status === "fulfilled") return result.value;

		const error =
			result.reason instanceof Error
				? result.reason.message
				: "Unknown delivery error";

		// Logged here rather than at the call site so the reason survives even
		// though nothing upstream is allowed to fail because of it.
		console.error(
			`Contact notification failed on ${NOTIFIERS[index].channel}:`,
			result.reason,
		);

		return { channel: NOTIFIERS[index].channel, status: "failed", error };
	});
}

/**
 * Whether the alert actually reached a person.
 *
 * "At least one channel delivered" rather than "all of them did", because the
 * question this answers is whether anyone knows the message exists. Requiring
 * both would leave rows looking unannounced while the Telegram alert was already
 * on someone's phone - and would make adding a third channel retroactively mark
 * old rows as incomplete.
 */
export function wasNotificationDelivered(outcomes: DeliveryOutcome[]): boolean {
	return outcomes.some((outcome) => outcome.status === "delivered");
}

/** Names the configured channels, for the startup/debug log. */
export function listConfiguredChannels(): string[] {
	return NOTIFIERS.filter((notifier) => notifier.isConfigured()).map(
		(notifier) => notifier.channel,
	);
}
