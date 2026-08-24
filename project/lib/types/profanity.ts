/**
 * detection result - represents the outcome from a profanity detector, providing
 * an optional matched word list when supported by the underlying implementation.
 */
export interface DetectionResult {
	isProfane: boolean;
	/** The specific words found, when the detector can name them. */
	matched?: string[];
}

/**
 * profanity detector - abstracts profanity checking across different
 * implementations (e.g. local lists, remote APIs), enforcing a single contract
 * and centralized configuration check to simplify caller usage.
 */
export interface ProfanityDetector {
	/** Used in the flag reason and in logs. */
	readonly name: string;

	/** False when this detector's environment is not set up. */
	isConfigured(): boolean;

	/** Throws on failure. The registry decides that is survivable. */
	detect(text: string): Promise<DetectionResult>;
}

/**
 * moderation verdict - aggregates the final decision across all executed
 * profanity detectors, storing the detector names rather than the offending
 * text to maintain a clean moderation queue.
 */
export interface ModerationVerdict {
	isFlagged: boolean;
	reason: string | null;
	/** Names of the detectors that fired, so two tiers can be merged exactly. */
	hits?: string[];
	failedDetectors?: string[];
}
