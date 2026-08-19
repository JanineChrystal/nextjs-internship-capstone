/**
 * How long typing must pause before a search runs.
 *
 * 250ms is roughly the gap between words for a fast typist, so "kanban board"
 * costs two queries rather than twelve. Much lower and the saving disappears;
 * much higher and the box feels like it is not listening.
 */
export const SEARCH_DEBOUNCE_MS = 250;

/**
 * Below this, searching is not attempted.
 *
 * A single character matches an enormous share of any real dataset, so the
 * result list is both useless and expensive. Two is the point where the answer
 * starts meaning something.
 */
export const SEARCH_MIN_LENGTH = 2;

/** Guards against a pathological query being sent at all. */
export const SEARCH_MAX_LENGTH = 100;

/**
 * How many hits each group returns.
 *
 * Capped per group rather than overall, so a project matching fifty tasks cannot
 * push every person and project off the list. The reader is choosing between
 * kinds of thing first and instances second.
 */
export const SEARCH_GROUP_LIMIT = 5;
