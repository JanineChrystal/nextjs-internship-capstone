import { Filter } from "bad-words";
import type { DetectionResult, ProfanityDetector } from "@/lib/types/profanity";

/**
 * English profanity, from a word list running in this process.
 *
 * No network, no latency, no failure mode - which is exactly why it is worth
 * having alongside the remote detector. When the API is down or slow, detection
 * degrades to English-only rather than disappearing.
 *
 * ## What it is good and bad at, honestly
 *
 * It catches whole words including some symbol substitution (`sh!t` is caught).
 * It does not catch letters separated by spaces, and it is a fixed English list,
 * so Filipino and Visayan pass straight through - which is the whole reason the
 * second detector exists.
 *
 * Checked for the Scunthorpe problem before choosing it: `assignment`,
 * `classic` and `bass` all come back clean, so it is matching words rather than
 * substrings. That was worth verifying - a filter that flags "assignment" on a
 * project-management tool would be worse than no filter.
 *
 * `obscenity` handles leetspeak considerably better if false negatives become a
 * problem; swapping is this one file.
 */
export class EnglishProfanityDetector implements ProfanityDetector {
	readonly name = "english";

	/**
	 * One Filter for the lifetime of the module.
	 *
	 * Constructing it compiles the word list, so building a new one per comment
	 * would repeat that work on every post for no benefit - the list never
	 * changes at runtime.
	 */
	private readonly filter = new Filter();

	isConfigured(): boolean {
		return true;
	}

	async detect(text: string): Promise<DetectionResult> {
		return { isProfane: this.filter.isProfane(text) };
	}
}
