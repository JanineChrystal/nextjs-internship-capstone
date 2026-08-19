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
 * A two-second budget - the obvious choice, and the one originally planned -
 * would have aborted almost every cold start. Filipino detection would then be
 * silently off for exactly the first comment after a quiet period, which is a
 * failure nobody would ever notice.
 */
export const PROFANITY_API_TIMEOUT_MS = 8000;

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
