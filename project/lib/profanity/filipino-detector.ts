import "server-only";
import {
	PROFANITY_API_BASE_URL,
	PROFANITY_API_TIMEOUT_MS,
} from "@/lib/constants/profanity";
import type { DetectionResult, ProfanityDetector } from "@/lib/types/profanity";

/**
 * Filipino and Visayan profanity, via the Filipino Profanity API.
 *
 * The English word list is a fixed English list, so "gago", "yawa" and their
 * regional variants pass straight through it. This detector is the reason
 * moderation works at all for the language most of this app's users argue in.
 *
 * ## Two endpoints, not one - and this was measured, not assumed
 *
 * The service advertises 8,000+ leetspeak variants, but they are **not** applied
 * by `/api/check`. Probing the live API directly:
 *
 *     POST /api/check          { "text": "g4g0 ka talaga" }  -> hasProfanity: false
 *     POST /api/variants/lookup{ "text": "g4g0 ka talaga" }  -> hasMatch: true
 *
 * So relying on `/api/check` alone would have shipped a filter that any user
 * defeats by typing `g4g0` instead of `gago` - the single most obvious way to
 * evade a profanity filter, and the exact case the service was built to catch.
 * Both endpoints are called, and either one firing flags the comment.
 *
 * They run in parallel, so the cost is the slower of the two rather than their
 * sum.
 *
 * ## Configuration
 *
 * `FILIPINO_PROFANITY_API_URL` overrides the base URL, so a self-hosted or
 * staging deployment needs no code change. It defaults to the public
 * deployment, which means moderation works with no setup at all.
 */
export class FilipinoProfanityDetector implements ProfanityDetector {
	readonly name = "filipino";

	/** lazy configuration - read at call time, never at module load, so a bad value cannot throw. */
	private get baseUrl(): string {
		return (
			process.env.FILIPINO_PROFANITY_API_URL?.replace(/\/+$/, "") ||
			PROFANITY_API_BASE_URL
		);
	}

	/**
	 * The service is public and needs no key today. This is here because the
	 * endpoint is rate limited per IP and the repository is under active
	 * development - if a key is ever added, it costs nothing to already send one.
	 */
	private get apiKey(): string | undefined {
		return process.env.FILIPINO_PROFANITY_API_KEY;
	}

	/** default fallback - always available: the base URL falls back to the public deployment. */
	isConfigured(): boolean {
		return Boolean(this.baseUrl);
	}

	async detect(text: string): Promise<DetectionResult> {
		// Parallel, not sequential. Two round trips one after the other would
		// double a latency that is already the slowest part of posting a comment.
		const [check, variants] = await Promise.all([
			// normal bad words check
			this.post("/check", text),
			// leetspeak bad words w/ special characters
			this.post("/variants/lookup", text),
		]);

		const direct = parseCheckResponse(check);
		const obfuscated = parseVariantResponse(variants);

		return {
			isProfane: direct.isProfane || obfuscated.isProfane,
			matched: [
				...(direct.matched ?? []),
				...(obfuscated.matched ?? []),
			].filter((word, index, all) => all.indexOf(word) === index),
		};
	}

	private async post(path: string, text: string): Promise<unknown> {
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};
		if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;

		const response = await fetch(`${this.baseUrl}${path}`, {
			method: "POST",
			headers,
			body: JSON.stringify({ text }),
			signal: AbortSignal.timeout(PROFANITY_API_TIMEOUT_MS),
		});

		if (!response.ok) {
			const detail = await response.text().catch(() => "");
			// 429 is called out because it is the failure most likely to appear
			// under real use - the endpoint allows 30 requests per minute per IP,
			// and every user of this app shares one server IP.
			const label = response.status === 429 ? "rate limited" : "error";
			throw new Error(
				`Profanity API ${label} on ${path}: ${response.status}${detail ? ` ${detail.slice(0, 160)}` : ""}`,
			);
		}

		return response.json();
	}
}

/**
 * Reads `POST /api/check`.
 *
 *     { "success": true, "hasProfanity": true, "count": 1,
 *       "data": [{ "word": "gago", "language": "filipino", ... }] }
 *
 * Exported for its tests: this is the piece that breaks if the service changes
 * its response, and a pure function can be checked without a network call.
 */
export function parseCheckResponse(payload: unknown): DetectionResult {
	const body = asObject(payload, "check");

	if (typeof body.hasProfanity !== "boolean") {
		throw new Error(
			`Profanity API /check had no hasProfanity field. Keys: ${Object.keys(body).join(", ") || "(none)"}`,
		);
	}

	return { isProfane: body.hasProfanity, matched: readWords(body.data) };
}

/**
 * Reads `POST /api/variants/lookup`.
 *
 *     { "success": true, "hasMatch": true, "matchCount": 1,
 *       "data": [{ "variant": "g4g0", "word": "gago", "position": 0 }] }
 *
 * Note the different verdict field - `hasMatch`, not `hasProfanity`. Assuming
 * the two endpoints agreed on a name is exactly the kind of thing that returns
 * "clean" forever without anyone noticing.
 */
export function parseVariantResponse(payload: unknown): DetectionResult {
	const body = asObject(payload, "variants/lookup");

	if (typeof body.hasMatch !== "boolean") {
		throw new Error(
			`Profanity API /variants/lookup had no hasMatch field. Keys: ${Object.keys(body).join(", ") || "(none)"}`,
		);
	}

	return { isProfane: body.hasMatch, matched: readWords(body.data) };
}

function asObject(payload: unknown, label: string): Record<string, unknown> {
	if (payload === null || typeof payload !== "object") {
		throw new Error(`Profanity API /${label} returned a non-object response`);
	}
	return payload as Record<string, unknown>;
}

/**
 * Pulls the base words out of either endpoint's `data` array.
 *
 * Both return objects rather than strings, and both carry a `word` field - the
 * variants endpoint additionally carries the `variant` that matched. The base
 * word is taken so a moderator sees "gago" rather than "g4g0", which is the
 * thing they can act on.
 */
function readWords(data: unknown): string[] | undefined {
	if (!Array.isArray(data)) return undefined;

	const words = data
		.map((entry) =>
			entry !== null && typeof entry === "object"
				? (entry as Record<string, unknown>).word
				: entry,
		)
		.filter((word): word is string => typeof word === "string");

	return words.length > 0 ? words : undefined;
}
