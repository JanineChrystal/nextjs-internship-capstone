import "server-only";
import { render } from "@react-email/render";
import type { ReactElement } from "react";
import { type EmailResult, sendEmail } from "@/lib/email/send-email";

interface SendNotificationOptions {
	/** The email address to send to */
	to: string;
	/** The subject of the email */
	subject: string;
	/** The React Email component to render */
	template: ReactElement;
	/**
	 * Whether this recipient's preferences allow the email.
	 *
	 * Supplied by the caller from `recordActivity`, which gets it from
	 * `createNotificationDAL` - the one place that reads a settings row. This
	 * function used to look the preference up itself, which meant two
	 * implementations of the same rule, and the one that ran was not the one that
	 * looked authoritative.
	 *
	 * An invited address with no account yet passes `true`: there is no settings
	 * row to consult, and someone being invited has not had the chance to opt out
	 * of the message that tells them they were invited.
	 */
	shouldSend: boolean;
	/** Optional reply-to address */
	replyTo?: string;
}

/**
 * Sends one notification email, honouring the recipient's preference.
 *
 * Transport lives in lib/email/send-email.ts; this adds the preference gate
 * and the template render on top of it.
 * Never throws: the caller has already completed the thing this email is about,
 * and a mail failure must not undo it.
 */
export async function sendNotification({
	to,
	subject,
	template,
	shouldSend,
	replyTo,
}: SendNotificationOptions): Promise<EmailResult> {
	if (!shouldSend) {
		return { status: "skipped", reason: "recipient has this email turned off" };
	}

	let html: string;
	try {
		html = await render(template);
	} catch (error) {
		return {
			status: "failed",
			reason: `template render failed: ${error instanceof Error ? error.message : String(error)}`,
		};
	}

	const result = await sendEmail({ to, subject, html, replyTo });

	// Logged at the level the outcome deserves. A skip is normal - somebody
	// turned an email off, or no key is configured yet - while a failure means
	// the provider rejected something and a person is not getting mail they
	// expect. Logging both as errors is how the real one gets ignored.
	if (result.status === "failed") {
		console.error(`Email to ${to} failed: ${result.reason}`);
	} else if (result.status === "skipped") {
		console.info(`Email to ${to} skipped: ${result.reason}`);
	}

	return result;
}
