/**
 * moderation tuning constants - defines empirically tested parameters
 * for comment moderation, specifically tuned against live API
 * measurements rather than guessed values.
 */

/**
 * profanity api url - sets the default endpoint for the Filipino
 * Profanity API to ensure out-of-the-box functionality, while remaining
 * overridable via environment variables for staging or self-hosting.
 */
export const PROFANITY_API_BASE_URL =
	"https://filipino-profanity-api-latest.vercel.app/api";

/**
 * profanity api timeout ms - defines a 3-second timeout budget to
 * accommodate API cold starts and warm requests without indefinitely
 * hanging the user, leaving any timeouts to be safely caught by the
 * retry queue.
 */
export const PROFANITY_API_TIMEOUT_MS = 3000;

/**
 * flag reasons - defines explicit moderation flag categories that name
 * the triggered detector rather than repeating the offensive word in
 * the database.
 */
export const FLAG_REASONS = {
	english: "English profanity",
	filipino: "Filipino profanity",
	both: "English and Filipino profanity",
} as const;

/** flagged snippet length - specifies the character count for the comment preview snippet displayed in the moderation table. */
export const FLAGGED_SNIPPET_LENGTH = 160;

/**
 * profanity retry batch size - sets a strict limit on bulk moderation
 * retries based on API rate limits to prevent 429 errors and ensure
 * the queue can actually drain without exceeding serverless execution
 * budgets.
 */
export const PROFANITY_RETRY_BATCH_SIZE = 10;
