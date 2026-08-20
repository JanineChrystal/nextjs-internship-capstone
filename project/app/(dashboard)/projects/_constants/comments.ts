/**
 * How many root comments one page of a task thread holds.
 *
 * Counted in root comments rather than total rows, because the query always
 * returns every reply belonging to the roots on a page - a reply must never be
 * split from its parent across a page boundary.
 */
export const COMMENTS_PAGE_SIZE = 20;

/**
 * Copy for the moderation dialog in the comment composer.
 *
 * One dialog, not two. An earlier version asked "are you sure?" for English
 * profanity and said nothing at all for Filipino, because only the local word
 * list had answered by the time the response was sent. Same offence, two
 * experiences. Both detectors now answer before the insert, so there is one
 * message for every flagged comment.
 *
 * It reports rather than asks: the comment is already saved and already queued,
 * so offering "Cancel" would imply something that can no longer be called off.
 */
export const COMMENT_MODERATION_DIALOG = {
	title: "Comment under review",
	message:
		"Your comment was detected to have a profanity word/s. Your comment is now under review.",
	confirmText: "Got it",
} as const;
