/**
 * The four things the app ever needs to tell somebody after an action.
 *
 * Deliberately four and not more. Every extra tone is another decision at every
 * call site and another thing for the reader to learn, and these four already
 * cover the full space: it worked, it needs your attention, it failed, here is
 * a fact. A fifth tone would overlap one of them.
 */
export type FeedbackTone = "success" | "warning" | "error" | "info";

/**
 * The tones a confirmation dialog can take.
 *
 * `danger` is separate from `error` on purpose - they look similar and mean
 * opposite things in time. `error` reports something that already went wrong;
 * `danger` warns about something the reader is about to do and can still call
 * off. Sharing one name would make the confirm button's colour meaningless.
 */
export type ConfirmTone = "danger" | "warning" | "info" | "default";

/** What a confirmation is asking permission for. Drives the generated copy. */
export type ConfirmAction =
	| "create"
	| "edit"
	| "delete"
	| "archive"
	| "complete";

/**
 * Inputs for the shared confirmation copy builder.
 *
 * `count` is what makes one dialog serve both the single and bulk cases: the
 * builder switches between "this project" and "3 projects" rather than every
 * call site hand-writing a sentence and pluralising it slightly differently.
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
