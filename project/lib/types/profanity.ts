/**
 * What a detector reports back.
 *
 * `matched` is optional because not every detector can say *what* it found -
 * the local library answers a yes/no question - and a flag reason that says
 * "English profanity" is still more useful to a moderator than no reason at all.
 */
export interface DetectionResult {
	isProfane: boolean;
	/** The specific words found, when the detector can name them. */
	matched?: string[];
}

/**
 * One way of deciding whether a comment contains profanity.
 *
 * ## Why this is an interface with two implementations
 *
 * The two detectors have nothing in common internally. One is a word list
 * running in-process with no latency and no failure mode; the other is an HTTP
 * call to a separate service that can be slow, rate-limited or down. But the
 * caller needs exactly one thing from both: "is this text profane?"
 *
 * Writing it as one function with an `if (language === "english")` inside would
 * mean every new language edits the same function, and the caller re-asking
 * which detector it is dealing with. Behind this interface, adding Cebuano or
 * Ilocano later is a new file plus one line in the registry.
 *
 * This is the same shape the contact notifiers use, and it is where
 * object-orientation earns its place here rather than being applied for its own
 * sake: two genuinely different implementations, one contract, and callers that
 * never branch.
 *
 * `isConfigured()` exists for the same reason it does on a notifier - only the
 * detector knows what it needs. The local one is always ready; the remote one is
 * not configured until its URL is set, and the app must work either way.
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
 * The verdict for one comment, merged across every detector that ran.
 *
 * `reason` is stored on the comment row and shown to whoever moderates it, so it
 * names the detector rather than repeating the offending word - a moderation
 * queue that reprints the slur in a table is not an improvement on the comment.
 */
export interface ModerationVerdict {
	isFlagged: boolean;
	reason: string | null;
	failedDetectors?: string[];
}
