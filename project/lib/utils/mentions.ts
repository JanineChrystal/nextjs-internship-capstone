/**
 * Parsing and rendering @-mentions.
 *
 * Every function here is pure - no database, no session, no React - which is
 * what lets the rules be tested directly. The interesting decisions are all in
 * this file, and none of them need a running app to verify.
 *
 * ## Why a mention is `@handle` and not `@Full Name`
 *
 * People think in names, but names contain spaces, and free text gives no way to
 * know where one ends: in `@Janine Chrystal reviewed this`, a parser cannot tell
 * whether the mention is "Janine", "Janine Chrystal", or "Janine Chrystal
 * reviewed". Every workaround is worse - requiring quotes, or greedily matching
 * the longest member name, which silently breaks when two members share a first
 * name.
 *
 * So the token written into the comment body is the **email local part**: the
 * text before the @ in the address. It is unique (email is unique, and sign-up
 * is restricted to one domain), it never contains a space, and it needs no
 * lookup table to parse.
 *
 * The reader never sees it. The composer shows full names and inserts the
 * handle; rendering swaps the handle back for the member's display name. The
 * awkward identifier exists only in storage, where nobody reads it.
 */

/**
 * A handle is the local part of a Gmail address, so it can contain letters,
 * digits, dot, underscore, percent, plus and hyphen.
 *
 * The leading `(^|[^\w@])` is what stops an email address in the body from being
 * read as a mention: in "mail me at juan@gmail.com", the `@gmail` is preceded by
 * a word character, so it does not match. Without that guard, every email
 * address in a comment would try to mention a user called "gmail".
 */
const MENTION_PATTERN = /(^|[^\w@])@([a-zA-Z0-9._%+-]+)/g;

/** handle formatter - the handle for a member, derived from their address. */
export function toMentionHandle(email: string): string {
	return email.split("@")[0].toLowerCase();
}

/**
 * Every handle written in a comment body, lower-cased and de-duplicated.
 *
 * De-duplication matters: mentioning someone twice in one comment must not
 * notify them twice, and the unique constraint on the mentions table would
 * reject the second row anyway.
 *
 * This does not decide who is a real member - it only reads what was typed. The
 * caller resolves handles against the project's members, and anything that does
 * not match is dropped rather than erroring, because "@here" and "@everyone" are
 * things people type without meaning a person.
 */
export function extractMentionHandles(body: string): string[] {
	const handles = new Set<string>();

	// matchAll rather than a while(exec) loop: the regex is /g and stateful, so a
	// shared lastIndex between calls is a genuine source of missed matches.
	for (const match of body.matchAll(MENTION_PATTERN)) {
		handles.add(match[2].toLowerCase());
	}

	return [...handles];
}

/**
 * One piece of a comment body, ready to render.
 *
 * A mention that resolved to a real member carries their id and display name; a
 * handle that matched nobody stays plain text, so `@lunch` reads as typed rather
 * than as a broken link.
 */
export type MentionToken =
	| { type: "text"; value: string }
	| { type: "mention"; value: string; userId: string; label: string };

/**
 * Splits a body into text and mention tokens.
 *
 * ## Why this returns tokens instead of HTML
 *
 * The obvious implementation wraps mentions in `<span>` tags and hands the
 * string to `dangerouslySetInnerHTML`. That would make every comment body a
 * script injection vector - the body is user input, and this app's own comment
 * form is reachable by anyone with a guest role.
 *
 * Returning an array the component maps into React elements means React escapes
 * every text node itself, and there is no path from a comment to executable
 * markup. This is also why the codebase bans `dangerouslySetInnerHTML` outright:
 * the safe version is barely more code.
 *
 * @param resolve maps a handle to a member, or undefined if it matches nobody.
 */
export function tokenizeMentions(
	body: string,
	resolve: (handle: string) => { userId: string; label: string } | undefined,
): MentionToken[] {
	const tokens: MentionToken[] = [];
	let cursor = 0;

	for (const match of body.matchAll(MENTION_PATTERN)) {
		const [full, prefix, handle] = match;
		const start = match.index ?? 0;

		// The prefix is the character before the "@" - it belongs to the text
		// before the mention, not to the mention itself.
		const textEnd = start + prefix.length;
		if (textEnd > cursor) {
			tokens.push({ type: "text", value: body.slice(cursor, textEnd) });
		}

		const member = resolve(handle.toLowerCase());
		if (member) {
			tokens.push({
				type: "mention",
				value: `@${handle}`,
				userId: member.userId,
				label: member.label,
			});
		} else {
			// Unresolved: keep exactly what was typed.
			tokens.push({ type: "text", value: `@${handle}` });
		}

		cursor = start + full.length;
	}

	if (cursor < body.length) {
		tokens.push({ type: "text", value: body.slice(cursor) });
	}

	return tokens;
}

/**
 * Replaces the partial handle the caret sits in with a chosen one.
 *
 * Used by the composer when a suggestion is picked. Returns the new body and
 * where the caret should land, because setting the text without moving the caret
 * drops it back to the end of the box mid-sentence.
 */
export function applyMentionAtCaret(
	body: string,
	caret: number,
	handle: string,
): { body: string; caret: number } {
	const before = body.slice(0, caret);
	const trigger = before.lastIndexOf("@");

	// Nothing to replace - insert at the caret instead of corrupting the text.
	if (trigger === -1) {
		const inserted = `@${handle} `;
		return {
			body: before + inserted + body.slice(caret),
			caret: caret + inserted.length,
		};
	}

	const replacement = `@${handle} `;
	const nextBody = body.slice(0, trigger) + replacement + body.slice(caret);
	return { body: nextBody, caret: trigger + replacement.length };
}

/**
 * The partial handle being typed at the caret, or null when not in a mention.
 *
 * Returns null as soon as a space follows the "@", because a mention handle
 * never contains one - that is what stops the suggestion list from staying open
 * for the rest of the sentence after someone types an email address or an
 * ordinary "@".
 */
export function readMentionQuery(body: string, caret: number): string | null {
	const before = body.slice(0, caret);
	const trigger = before.lastIndexOf("@");
	if (trigger === -1) return null;

	// Same guard as the pattern: an "@" glued to a word is part of an address.
	const preceding = trigger > 0 ? before[trigger - 1] : "";
	if (preceding && /[\w@]/.test(preceding)) return null;

	const query = before.slice(trigger + 1);
	if (/\s/.test(query)) return null;

	return query.toLowerCase();
}
