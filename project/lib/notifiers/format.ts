import {
	CONTACT_TOPIC_LABELS,
	TELEGRAM_MAX_LENGTH,
} from "@/lib/constants/contact";
import type { ContactNotification } from "@/lib/types/notifier";

/**
 * Turning an untrusted contact message into markup, safely.
 *
 * ## Why all of this lives here rather than inside the notifier classes
 *
 * The classes are transport: they hold credentials, make one HTTP request, and
 * interpret the response. This module is formatting: pure functions, no
 * network, no environment variables, no `server-only` marker. Splitting them
 * that way is single responsibility applied for a concrete payoff - every
 * function below is unit-testable, and these are the parts with real edge cases
 * (escaping order, entity-splitting, length budgets). A private method on a
 * class that also performs a fetch can only be tested by mocking the fetch.
 *
 * ## The security point, because this is the part that matters
 *
 * Everything in a ContactNotification came from a public form that anyone on the
 * internet can submit. It is validated - the schema caps the length and checks
 * the email - but it is never *sanitised*, because there is no such thing as
 * text that is safe in every context. `<b>hello</b>` is harmless in a database
 * column, meaningful markup in an HTML email, and a parse error in a Telegram
 * message.
 *
 * So escaping happens at the moment a value is placed into a specific format,
 * and never earlier. That is the same rule React follows by escaping on render -
 * the difference is that an email body is a string we build ourselves, so
 * nothing escapes it for us.
 */

/**
 * Escapes the five characters that have meaning in HTML.
 *
 * `&` must be replaced first. Doing it later would re-escape the ampersands
 * introduced by the other four replacements, turning `<` into `&amp;lt;` and
 * printing the entity instead of the character.
 *
 * This also covers Telegram, whose HTML parse mode requires exactly `&`, `<` and
 * `>` to be escaped - a superset is still valid there.
 */
export function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

/** The topic's human label, falling back to the raw value if one is ever added
 *  to the enum without a label. Better a slightly ugly alert than no alert. */
export function toTopicLabel(topic: ContactNotification["topic"]): string {
	return CONTACT_TOPIC_LABELS[topic] ?? topic;
}

/**
 * The subject line.
 *
 * Returns plain text on purpose, so it cannot be double-escaped: the caller
 * escapes it for whichever format it lands in.
 */
export function buildSubject(notification: ContactNotification): string {
	return `[Takda PH] ${toTopicLabel(notification.topic)} - ${notification.name}`;
}

/**
 * The plain-text alternative part of the email.
 *
 * Not optional politeness: an email sent with only an HTML part is scored as
 * more likely to be spam by most filters, and some clients still render text
 * only. It costs one function.
 */
export function buildPlainTextBody(notification: ContactNotification): string {
	const lines = [
		`Topic:   ${toTopicLabel(notification.topic)}`,
		`From:    ${notification.name} <${notification.email}>`,
	];

	if (notification.organization) {
		lines.push(`Org:     ${notification.organization}`);
	}

	lines.push(
		`Received: ${notification.receivedAt.toISOString()}`,
		`Ref:      ${notification.id}`,
		"",
		notification.message,
	);

	return lines.join("\n");
}

/**
 * The HTML part of the email.
 *
 * Inline styles, not classes: email clients strip `<style>` blocks
 * inconsistently and none of them load an external stylesheet, so a class name
 * here would render as unstyled text in roughly half of all inboxes.
 *
 * Every interpolated value goes through escapeHtml. The message body also has
 * its newlines turned into `<br />` - which must happen *after* escaping, or the
 * tags just inserted would be escaped along with everything else.
 */
export function buildHtmlBody(notification: ContactNotification): string {
	const rows: [string, string][] = [
		["Topic", toTopicLabel(notification.topic)],
		["From", `${notification.name} <${notification.email}>`],
	];

	if (notification.organization) {
		rows.push(["Organisation", notification.organization]);
	}

	rows.push(["Reference", notification.id]);

	const tableRows = rows
		.map(
			([label, value]) =>
				`<tr><td style="padding:4px 12px 4px 0;color:#6b7280;white-space:nowrap;vertical-align:top">${escapeHtml(label)}</td><td style="padding:4px 0;color:#111827">${escapeHtml(value)}</td></tr>`,
		)
		.join("");

	const body = escapeHtml(notification.message).replace(/\n/g, "<br />");

	return `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:14px;line-height:1.6;color:#111827;max-width:640px">
<h2 style="margin:0 0 16px;font-size:18px">New message from the Takda PH landing page</h2>
<table style="border-collapse:collapse;margin-bottom:16px">${tableRows}</table>
<div style="padding:16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px">${body}</div>
<p style="margin:16px 0 0;font-size:12px;color:#6b7280">Reply to this email to answer ${escapeHtml(notification.name)} directly.</p>
</div>`;
}

/**
 * The Telegram alert: a header block, the body, then the row's id.
 *
 * Only the body is ever truncated, and it is truncated *before* the message is
 * assembled. Trimming the finished string instead - the obvious way - can cut
 * through a closing `</code>` or split an `&amp;` in half, and Telegram rejects
 * unbalanced markup outright. That would make the safety net the thing that
 * loses the alert.
 */
export function buildTelegramMessage(
	notification: ContactNotification,
): string {
	const header = [
		"<b>New message from the landing page</b>",
		"",
		`<b>Topic:</b> ${escapeHtml(toTopicLabel(notification.topic))}`,
		`<b>From:</b> ${escapeHtml(notification.name)} (${escapeHtml(notification.email)})`,
	];

	if (notification.organization) {
		header.push(`<b>Org:</b> ${escapeHtml(notification.organization)}`);
	}

	const footer = ["", `<code>${escapeHtml(notification.id)}</code>`];

	// Everything that is not the body, measured so the body gets whatever is left.
	const framing = [...header, "", "", ...footer].join("\n").length;

	return [
		...header,
		"",
		fitTelegramBody(notification.message, TELEGRAM_MAX_LENGTH - framing),
		...footer,
	].join("\n");
}

/**
 * Escapes the body, then trims it to a budget without splitting an entity.
 *
 * The budget counts the *escaped* text, because that is what is transmitted:
 * `&amp;` is five characters on the wire though it is one to the reader.
 * Measuring the raw string would let a message full of ampersands sail past the
 * check and be rejected by the API.
 *
 * Exported for its tests. Nothing else calls it.
 */
export function fitTelegramBody(message: string, budget: number): string {
	const escaped = escapeHtml(message);
	if (escaped.length <= budget) return escaped;

	const notice = "\n\n<i>[truncated - full message is in the database]</i>";
	const cut = escaped.slice(0, Math.max(0, budget - notice.length));

	// Pull back to before a half-written entity: if the last "&" sits after the
	// last ";", it opened something this cut did not close.
	const lastAmpersand = cut.lastIndexOf("&");
	const safe =
		lastAmpersand > cut.lastIndexOf(";") ? cut.slice(0, lastAmpersand) : cut;

	return safe + notice;
}
