import "server-only";
import { sendEmail } from "@/lib/email/send-email";
import type {
	ContactNotification,
	ContactNotifier,
} from "@/lib/types/notifier";
import { buildHtmlBody, buildSubject } from "./format";

/**
 * Emails the enquiry to whoever runs the inbox.
 *
 * This class is transport-agnostic now: it decides WHO is told and WHAT they
 * read, and hands the actual sending to `lib/email/send-email.ts`. It used to
 * hand-roll its own `fetch`, which meant the same endpoint, auth header and
 * timeout existed twice - here and in the notification sender - and a provider
 * change had to edit both.
 *
 * How the email reads is buildHtmlBody and buildSubject in ./format, which are
 * pure and tested.
 */
export class SendGridNotifier implements ContactNotifier {
	readonly channel = "sendgrid";

	/**
	 * Read at call time rather than at module load.
	 *
	 * `lib/rate-limit.ts` reads its variables at module scope and throws when one
	 * is missing, which is why the contact action has to import it lazily. This
	 * class does not repeat that mistake: with no key set it simply reports
	 * itself unconfigured, so the app builds and runs normally until you add one.
	 */
	private get apiKey(): string | undefined {
		return process.env.SENDGRID_API_KEY;
	}

	private get from(): string | undefined {
		return process.env.CONTACT_EMAIL_FROM;
	}

	/** multiple recipients - comma-separated in the environment, so more than one person can be told. */
	private get recipients(): string[] {
		return (process.env.CONTACT_EMAIL_TO ?? "")
			.split(",")
			.map((address) => address.trim())
			.filter(Boolean);
	}

	isConfigured(): boolean {
		return Boolean(this.apiKey && this.from && this.recipients.length > 0);
	}

	/**
	 * Throws on failure, because the contact pipeline distinguishes "we tried and
	 * it failed" from "nobody tried" by whether this rejects - that is what
	 * `notifiedAt` records, and what makes the unnotified-messages query mean
	 * something.
	 */
	async deliver(notification: ContactNotification): Promise<void> {
		const subject = buildSubject(notification);
		const html = buildHtmlBody(notification);

		const failures: string[] = [];

		// One request per recipient. SendGrid can take several in one
		// personalization, but then every recipient sees the others' addresses -
		// fine for one operator, wrong the moment a second person is added.
		for (const to of this.recipients) {
			const result = await sendEmail({
				to,
				subject,
				html,
				// Replying in the mail client goes to the person who wrote in, not
				// back to our own sending address. Without this, hitting Reply mails
				// the robot.
				replyTo: notification.email,
			});

			if (result.status !== "sent") failures.push(result.reason);
		}

		if (failures.length > 0) {
			throw new Error(`SendGrid delivery failed: ${failures.join("; ")}`);
		}
	}
}
