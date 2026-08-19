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
 * returned a shape we could not read - is treated as "found nothing". The
 * comment posts.
 *
 * The alternative is refusing to accept a comment because a moderation service
 * is unavailable, which means an outage in a hobby deployment silently stops a
 * team from talking to each other. Moderation is a safety net, not a gate: this
 * system **flags** rather than blocks, so a missed flag costs a comment sitting
 * unreviewed for a while, while a false refusal costs someone their words.
 *
 * The English detector runs in-process and cannot fail, so detection degrades
 * rather than disappearing - that is the point of having two.
 *
 * ## Both run, always
 *
 * `Promise.allSettled`, not a short-circuit on the first hit. A comment can be
 * profane in both languages, and the reason shown to the moderator should say
 * so. It also means the remote call is never skipped because the local one
 * happened to match first, so the flag reason is stable rather than depending on
 * which detector ran first.
 */
export async function detectProfanity(
	text: string,
): Promise<ModerationVerdict> {
	const active = DETECTORS.filter((detector) => detector.isConfigured());
	if (active.length === 0) return { isFlagged: false, reason: null };

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

	if (hits.length === 0)
		return { isFlagged: false, reason: null, failedDetectors };

	const reason =
		hits.length > 1
			? FLAG_REASONS.both
			: hits[0] === "english"
				? FLAG_REASONS.english
				: FLAG_REASONS.filipino;

	return { isFlagged: true, reason, failedDetectors };
}

export function listActiveDetectors(): string[] {
	return DETECTORS.filter((detector) => detector.isConfigured()).map(
		(detector) => detector.name,
	);
}
