import "server-only";

/**
 * The one place this app talks to an email provider.
 *
 * Both senders - the contact-form notifier and the in-app notification emails -
 * used to hand-roll their own `fetch` against Resend, which meant two copies of
 * the endpoint, the auth header, the timeout and the error handling. Swapping
 * provider meant editing both and hoping they stayed in step. This is that one
 * file, so the next change is one file.
 *
 * ## Why SendGrid, and why a single verified sender
 *
 * Every transactional provider requires you to prove you are allowed to send as
 * an address. Resend proves it per DOMAIN, which needs a domain you own and DNS
 * records on it. SendGrid also offers Single Sender Verification, which proves
 * one individual address - a Gmail account will do - and that is what lets this
 * prototype email real people without buying anything.
 *
 * The cost is deliverability: mail sent as a gmail.com address through
 * SendGrid's servers cannot be DKIM-aligned with gmail.com, so recipients may
 * see "via sendgrid.net" and it is likelier to land in spam. That is a real
 * trade, made deliberately: a demo that reaches an inbox occasionally beats one
 * that cannot reach anyone but the operator.
 */

const SENDGRID_ENDPOINT = "https://api.sendgrid.com/v3/mail/send";

/** Long enough for a slow API, short enough not to hold a serverless function. */
const EMAIL_TIMEOUT_MS = 10_000;

/**
 * What happened to one email.
 *
 * Three outcomes, not two, and the distinction is the point. "Skipped" means
 * nobody tried - no API key, or the recipient turned this email off - while
 * "failed" means we tried and the provider said no. Collapsing them into a
 * boolean is how a rejected recipient hid behind an empty inbox for an evening:
 * the log said the same thing either way.
 */
export type EmailResult =
	| { status: "sent" }
	| { status: "skipped"; reason: string }
	| { status: "failed"; reason: string };

export interface SendEmailOptions {
	to: string;
	subject: string;
	html: string;
	/** Where a reply goes. Defaults to the verified sender. */
	replyTo?: string;
}

/**
 * Posts one email, and never throws.
 *
 * Callers are always doing something else that already succeeded - a comment is
 * posted, a member is invited - and an email failure must not undo it. The
 * result is returned so a caller that wants to react can, rather than being
 * raised at one that cannot.
 */
export async function sendEmail({
	to,
	subject,
	html,
	replyTo,
}: SendEmailOptions): Promise<EmailResult> {
	const apiKey = process.env.SENDGRID_API_KEY;
	const from = process.env.CONTACT_EMAIL_FROM;

	if (!apiKey || !from) {
		return {
			status: "skipped",
			reason: "SENDGRID_API_KEY or CONTACT_EMAIL_FROM is not set",
		};
	}

	const sender = parseSender(from);

	try {
		const response = await fetch(SENDGRID_ENDPOINT, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				personalizations: [{ to: [{ email: to }] }],
				from: sender,
				subject,
				content: [{ type: "text/html", value: html }],
				...(replyTo ? { reply_to: { email: replyTo } } : {}),
			}),
			signal: AbortSignal.timeout(EMAIL_TIMEOUT_MS),
		});

		// 202 Accepted, not 200. SendGrid queues rather than delivers
		// synchronously, so a 2xx here means "we have it", not "it arrived".
		if (response.ok) return { status: "sent" };

		// The body carries the part worth reading - "The from address does not
		// match a verified Sender Identity" is the one you will hit first, and the
		// status alone would send you looking at the API key instead.
		const detail = await response.text().catch(() => "");
		return {
			status: "failed",
			reason: `SendGrid responded ${response.status}${detail ? `: ${detail.slice(0, 300)}` : ""}`,
		};
	} catch (error) {
		return {
			status: "failed",
			reason: error instanceof Error ? error.message : String(error),
		};
	}
}

/**
 * Splits `Takda PH <takda@example.com>` into SendGrid's object form.
 *
 * Resend accepts that string verbatim; SendGrid wants `{ email, name }`. The
 * environment variable keeps the familiar format so nothing outside this file
 * has to know which provider is behind it - including a bare address with no
 * display name, which is equally valid.
 */
function parseSender(value: string): { email: string; name?: string } {
	const match = value.match(/^\s*(.*?)\s*<\s*(.+?)\s*>\s*$/);
	if (!match) return { email: value.trim() };

	const [, name, email] = match;
	return name ? { email, name } : { email };
}
