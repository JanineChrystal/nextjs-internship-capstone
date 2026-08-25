/**
 * Filipino and Visayan profanity the remote API does not know.
 *
 * Measured, not assumed: `POST /api/check` and `/api/variants/lookup` both
 * return clean for "tangina", while "gago" is found by both. The service's
 * list has gaps, and the most common Tagalog expletive sitting in one of them
 * is not something moderation can be built on.
 *
 * This list runs in-process, so it also keeps Filipino detection alive while
 * the API is cold, rate limited or down - the same reason the English detector
 * uses a local word list rather than a service.
 */
export const FILIPINO_PROFANITY = [
	"tangina",
	"tanginamo",
	"putangina",
	"putang ina",
	"kingina",
	"kinginamo",
	"punyeta",
	"pakshet",
	"pakyu",
	"kupal",
	"tarantado",
	"hinayupak",
	"hayup ka",
	"siraulo",
	"ulol",
	"gunggong",
	"bwisit",
	"buwisit",
	"lintik",
	"leche",
	"letse",
	"yawa",
	"piste",
	"bilat",
	"buang",
	"putcha",
	"pucha",
] as const;

/**
 * Left boundary only, deliberately.
 *
 * Tagalog attaches suffixes - "tanginang", "gagong", "ulol na" - so requiring a
 * boundary on both sides would miss the inflected forms people actually type.
 * Requiring one on the left is what stops a word matching inside an unrelated
 * one, which is the failure this whole guard exists for.
 */
export function matchesFilipinoWord(text: string, word: string): boolean {
	const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}`, "iu").test(text);
}

/** local scan - returns every listed word present in the text, base forms only. */
export function findLocalFilipinoProfanity(text: string): string[] {
	return FILIPINO_PROFANITY.filter((word) => matchesFilipinoWord(text, word));
}
