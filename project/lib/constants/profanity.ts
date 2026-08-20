/**
 * Comment moderation tuning.
 *
 * The numbers here were set against measurements of the live API rather than
 * guessed - see the timeout note, which is what drove moderation to run after
 * the comment is stored rather than in front of it.
 */

/**
 * The Filipino Profanity API, overridable with FILIPINO_PROFANITY_API_URL.
 *
 * Defaulting to the public deployment means moderation works with no setup.
 * The variable exists so a self-hosted or staging instance needs no code change.
 */
export const PROFANITY_API_BASE_URL =
	"https://filipino-profanity-api-latest.vercel.app/api";

/**
 * How long a detector may take before it is abandoned.
 *
 * Eight seconds looks generous, and would be indefensible if a user were waiting
 * on it. They are not: detection runs *after* the comment is stored and shown,
 * so this budget costs nobody anything and only bounds how long a background
 * task stays alive.
 *
 * It is set this high because of what the live service actually does. Measured
 * directly against the deployment:
 *
 *     health check (cold)   4570ms
 *     warm requests          449-642ms
 *     observed spikes       6536ms, 6908ms
 *
 * The budget is a compromise, and worth naming as one. This wait now sits in
 * front of the insert, so every second here is a second the author spends
 * watching a spinner - which argues for a small number. But a cold start takes
 * 4.5s, so a small number aborts exactly the first comment after a quiet
 * period, when Filipino detection is most likely to be needed.
 *
 * Three seconds covers every warm request with room to spare and gives a cold
 * start a chance, while capping the worst case at something a person will sit
 * through. A comment that does time out is not lost or unchecked: it is marked
 * pendingProfanityCheck and re-examined by the retry, so the cost of the cap is
 * a delayed verdict rather than a missed one.
 */
export const PROFANITY_API_TIMEOUT_MS = 3000;

/**
 * Flag reasons, as stored on the comment row.
 *
 * Deliberately name the detector rather than the word found. A moderation table
 * that reprints the slur in a "reason" column is not an improvement on the
 * comment being there in the first place - the moderator can read the comment
 * itself if they need to.
 */
export const FLAG_REASONS = {
	english: "English profanity",
	filipino: "Filipino profanity",
	both: "English and Filipino profanity",
} as const;

/** How much of the comment the moderation table previews. */
export const FLAGGED_SNIPPET_LENGTH = 160;

/**
 * How many pending comments one press of "Retry Pending Checks" re-examines.
 *
 * Derived from the rate limit rather than chosen by feel. The API allows 30
 * requests per minute per IP, every check costs two of them (/check plus
 * /variants/lookup), and every user of this deployment shares one IP:
 *
 *     30 requests/min / 2 per check  =  15 checks/min for the whole app
 *
 * Ten leaves ten requests of headroom for people actually posting comments
 * while a retry runs. Without a cap the loop kept going until it hit 429s,
 * which fail open and leave those comments still pending - so the next press
 * hit the same wall at the same place and the queue could never drain.
 *
 * The batch also bounds how long the request takes. Ten checks running together
 * finish in about the time of the slowest one, rather than the sum of all of
 * them, which is what used to run past the function's budget.
 */
export const PROFANITY_RETRY_BATCH_SIZE = 10;
