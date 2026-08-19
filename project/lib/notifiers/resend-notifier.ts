import "server-only";
import { NOTIFIER_TIMEOUT_MS } from "@/lib/constants/contact";
import type {
	ContactNotification,
	ContactNotifier,
} from "@/lib/types/notifier";
import { buildHtmlBody, buildPlainTextBody, buildSubject } from "./format";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/**
 * Emails the enquiry to whoever runs the inbox, through Resend.
 *
 * ## Why the REST API rather than the `resend` npm package
 *
 * The SDK is one `POST` in a wrapper. Calling the endpoint directly means: no
 * new dependency, the same `AbortSignal.timeout` and the same error handling as
 * the Telegram notifier beside it, and a request body that matches Resend's own
 * REST documentation line for line - which is what you will have open when you
 * add the key. If the SDK's retry behaviour is ever wanted, swapping is this one
 * file; nothing else knows how the email is sent.
 *
 * This class is transport only. How the email reads is buildHtmlBody and
 * buildPlainTextBody in ./format, which are pure and tested.
 *
 * Note the field is `reply_to`, snake_case. The REST API and the Node SDK differ
 * here - the SDK spells it `replyTo` - and sending the wrong one is silently
 * accepted and silently ignored, which is a genuinely annoying half hour.
 */
export class ResendNotifier implements ContactNotifier {
	readonly channel = "resend";

	/**
	 * Read at call time rather than at module load.
	 *
	 * `lib/rate-limit.ts` reads its variables at module scope and throws when one
	 * is missing, which is why the contact action has to import it lazily. This
	 * class does not repeat that mistake: with no key set it simply reports
	 * itself unconfigured, so the app builds and runs normally until you add one.
	 */
	private get apiKey(): string | undefined {
		return process.env.RESEND_API_KEY;
	}

	private get from(): string | undefined {
		return process.env.CONTACT_EMAIL_FROM;
	}

	/** Comma-separated in the environment, so more than one person can be told. */
	private get recipients(): string[] {
		return (process.env.CONTACT_EMAIL_TO ?? "")
			.split(",")
			.map((address) => address.trim())
			.filter(Boolean);
	}

	isConfigured(): boolean {
		return Boolean(this.apiKey && this.from && this.recipients.length > 0);
	}

	async deliver(notification: ContactNotification): Promise<void> {
		const response = await fetch(RESEND_ENDPOINT, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				from: this.from,
				to: this.recipients,
				subject: buildSubject(notification),
				// Replying in the mail client goes to the person who wrote in, not
				// back to our own sending address. Without this, hitting Reply mails
				// the robot.
				reply_to: notification.email,
				text: buildPlainTextBody(notification),
				html: buildHtmlBody(notification),
			}),
			signal: AbortSignal.timeout(NOTIFIER_TIMEOUT_MS),
		});

		if (!response.ok) {
			// Resend puts the useful part in the body - "domain is not verified",
			// "invalid from address" - and the status alone would send you looking
			// in the wrong place entirely.
			const detail = await response.text().catch(() => "");
			throw new Error(
				`Resend responded ${response.status}${detail ? `: ${detail}` : ""}`,
			);
		}
	}
}
