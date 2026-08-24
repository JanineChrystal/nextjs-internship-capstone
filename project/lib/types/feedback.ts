/**
 * feedback tone - strict union of the four permitted communication tones,
 * keeping the design space constrained and avoiding redundant or overlapping
 * messaging styles across the application.
 */
export type FeedbackTone = "success" | "warning" | "error" | "info";

/**
 * confirm tone - sets the visual tone of a confirmation dialog, keeping
 * 'danger' separate from 'error' to accurately reflect a pre-emptive warning
 * rather than a post-failure report.
 */
export type ConfirmTone = "danger" | "warning" | "info" | "default";

/**
 * confirm action - defines the triggering action for a confirmation dialog,
 * driving the generated copy.
 */
export type ConfirmAction =
	| "create"
	| "edit"
	| "delete"
	| "archive"
	| "complete";

/**
 * confirm copy input - configuration for the shared confirmation copy builder,
 * enabling dynamic pluralization and contextual consequence warnings without
 * requiring hand-written sentences at every call site.
 */
export interface ConfirmCopyInput {
	action: ConfirmAction;
	/** Singular noun, lower case, e.g. "project". */
	subject: string;
	/** Plural form. Passed explicitly - English pluralisation is not a rule. */
	subjectPlural?: string;
	/** How many items the action applies to. Defaults to 1. */
	count?: number;
	/** Appended to the description, for consequences the reader should know. */
	consequence?: string;
}
