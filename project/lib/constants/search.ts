/**
 * search debounce ms - establishes a 250ms delay for search inputs,
 * balancing query efficiency against UI responsiveness to prevent
 * excessive database calls.
 */
export const SEARCH_DEBOUNCE_MS = 250;

/**
 * search min length - restricts search execution to queries of at
 * least 2 characters to prevent expensive and useless single-character
 * database lookups.
 */
export const SEARCH_MIN_LENGTH = 2;

/** search max length - enforces a hard character limit to guard against pathologically large search queries. */
export const SEARCH_MAX_LENGTH = 100;

/**
 * search group limit - caps the number of results returned per group
 * category to ensure a diverse set of results across all entity types
 * rather than a list dominated by a single category.
 */
export const SEARCH_GROUP_LIMIT = 5;
