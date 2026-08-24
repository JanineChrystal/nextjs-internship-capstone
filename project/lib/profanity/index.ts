import "server-only";
import { FLAG_REASONS } from "@/lib/constants/profanity";
import type {
	ModerationVerdict,
	ProfanityDetector,
} from "@/lib/types/profanity";
import { EnglishProfanityDetector } from "./english-detector";
import { FilipinoProfanityDetector } from "./filipino-detector";

/**
 * The detectors a comment is checked against.
 *
 * Adding a language is a new file implementing ProfanityDetector plus a line
 * here. Nothing else changes - not the action, not the DAL, not the composer.
 */
const DETECTORS: ProfanityDetector[] = [
	new EnglishProfanityDetector(),
	new FilipinoProfanityDetector(),
];

/**
 * Runs every configured detector and merges their verdicts.
 *
 * ## Fail open, and why that is the right direction
 *
 * A detector that throws - the API is down, cold-starting, rate-limited, or
 * returned a shape we could not read - is treated as "found nothing", and the
 * comment posts. The alternative is refusing to accept a comment because a
 * moderation service is unavailable, which means an outage silently stops a
 * team from talking to each other.
 *
 * Failing open is only acceptable because the failure is *recorded*: the caller
 * reads `failedDetectors` and marks the comment for a later recheck, so a miss
 * is a delay rather than a permanent hole.
 *
 * ## Both run, always
 *
 * `Promise.allSettled`, not a short-circuit on the first hit. A comment can be
 * profane in both languages and the reason shown to the moderator should say
 * so. It also means the remote call is never skipped because the local one
 * matched first, so the reason is stable rather than depending on ordering.
 */
async function runDetectors(
	detectors: ProfanityDetector[],
	text: string,
): Promise<ModerationVerdict> {
	const active = detectors.filter((detector) => detector.isConfigured());
	if (active.length === 0)
		return { isFlagged: false, reason: null, hits: [], failedDetectors: [] };

	const settled = await Promise.allSettled(
		active.map((detector) => detector.detect(text)),
	);

	const hits: string[] = [];
	const failedDetectors: string[] = [];

	settled.forEach((outcome, index) => {
		const detector = active[index];

		if (outcome.status === "rejected") {
			// Logged, never thrown. The comment is already going to be posted; this
			// line is how you find out afterwards that Filipino detection has been
			// silently off for a week.
			console.error(
				`Profanity detector "${detector.name}" failed:`,
				outcome.reason,
			);
			failedDetectors.push(detector.name);
			return;
		}

		if (outcome.value.isProfane) hits.push(detector.name);
	});

	return {
		isFlagged: hits.length > 0,
		reason: reasonFor(hits),
		hits,
		failedDetectors,
	};
}

/** reason compiler - turns the set of detectors that fired into the sentence a moderator reads. */
function reasonFor(hits: string[]): string | null {
	if (hits.length === 0) return null;
	if (hits.length > 1) return FLAG_REASONS.both;
	return hits[0] === "english" ? FLAG_REASONS.english : FLAG_REASONS.filipino;
}

/**
 * Checks one comment against every configured detector.
 *
 * Awaited in front of the insert rather than deferred to `after()`. That costs
 * the author roughly 400ms against a warm API, and it buys the thing that
 * matters: every flagged comment - English or Filipino - produces the same
 * immediate response. Warning on English while the Filipino verdict arrived
 * silently minutes later was two different behaviours wearing one name.
 *
 * The wait is bounded by PROFANITY_API_TIMEOUT_MS. Past that the remote
 * detector fails open, the comment is marked for a later recheck, and nobody
 * loses their words because a hobby deployment happened to be cold.
 */
export async function detectProfanity(
	text: string,
): Promise<ModerationVerdict> {
	return runDetectors(DETECTORS, text);
}

export function listActiveDetectors(): string[] {
	return DETECTORS.filter((detector) => detector.isConfigured()).map(
		(detector) => detector.name,
	);
}
