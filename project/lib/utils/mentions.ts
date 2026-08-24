/**
 * mention parsing - pure functions for parsing and resolving @-mentions from
 * text, using email local parts to uniquely identify users without ambiguity.
 */

/**
 * mention pattern - regex for extracting valid @-handles while ignoring email
 * addresses by ensuring the @ is not preceded by a word character.
 */
const MENTION_PATTERN = /(^|[^\w@])@([a-zA-Z0-9._%+-]+)/g;

/**
 * handle formatter - the handle for a member, derived from their address.
 */
export function toMentionHandle(email: string): string {
	return email.split("@")[0].toLowerCase();
}

/**
 * mention extraction - extracts and deduplicates all potential @-handles
 * from a text body for downstream resolution against project members.
 */
export function extractMentionHandles(body: string): string[] {
	const handles = new Set<string>();

	/**
	 * regex execution - uses matchAll instead of a while(exec) loop to avoid
	 * missed matches caused by shared state in /g regular expressions.
	 */
	for (const match of body.matchAll(MENTION_PATTERN)) {
		handles.add(match[2].toLowerCase());
	}

	return [...handles];
}

/**
 * mention token - represents a parsed segment of text, either as raw text
 * or a successfully resolved user mention.
 */
export type MentionToken =
	| { type: "text"; value: string }
	| { type: "mention"; value: string; userId: string; label: string };

/**
 * mention tokenizer - safely splits text into renderable tokens instead of
 * HTML to prevent XSS injection, using a provided resolver to validate handles.
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

		/**
		 * prefix extraction - captures the character immediately preceding the "@"
		 * so it remains part of the surrounding text rather than the mention token.
		 */
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
			/**
			 * unresolved mention fallback - retains the original text verbatim when
			 * a handle does not resolve to an active member.
			 */
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
 * apply mention - inserts a selected handle at the current caret position
 * and calculates the new caret location.
 */
export function applyMentionAtCaret(
	body: string,
	caret: number,
	handle: string,
): { body: string; caret: number } {
	const before = body.slice(0, caret);
	const trigger = before.lastIndexOf("@");

	/**
	 * raw insertion - inserts the new mention at the caret position if no valid
	 * mention trigger is found, avoiding text corruption.
	 */
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
 * active query detection - extracts the partial handle currently being typed
 * at the caret, returning null if the query contains spaces or invalid characters.
 */
export function readMentionQuery(body: string, caret: number): string | null {
	const before = body.slice(0, caret);
	const trigger = before.lastIndexOf("@");
	if (trigger === -1) return null;

	/**
	 * address boundary guard - rejects partial queries immediately preceded by
	 * a word character to avoid interpreting email addresses as mentions.
	 */
	const preceding = trigger > 0 ? before[trigger - 1] : "";
	if (preceding && /[\w@]/.test(preceding)) return null;

	const query = before.slice(trigger + 1);
	if (/\s/.test(query)) return null;

	return query.toLowerCase();
}
