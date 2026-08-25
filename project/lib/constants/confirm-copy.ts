import { TRASH_RETENTION_DAYS } from "@/lib/constants/archive";
import type { ConfirmAction, ConfirmCopyInput } from "@/lib/types/feedback";

/**
 * action verb mapping - maps actions to their display verbs for use
 * in confirmation questions and buttons.
 */
const ACTION_VERB: Record<ConfirmAction, string> = {
	create: "create",
	edit: "save changes to",
	delete: "delete",
	archive: "archive",
	complete: "complete",
};

/**
 * action label mapping - maps actions to explicit button labels,
 * avoiding ambiguous "OK" terminology.
 */
const ACTION_LABEL: Record<ConfirmAction, string> = {
	create: "Create",
	edit: "Save changes",
	delete: "Delete",
	archive: "Archive",
	complete: "Complete",
};

/**
 * action consequences mapping - defines accurate, context-aware
 * consequence warnings for actions (like delete and archive) to
 * avoid alarm fatigue and clearly communicate recoverability where
 * applicable.
 */
const ACTION_CONSEQUENCE: Partial<
	Record<ConfirmAction, (isBulk: boolean) => string>
> = {
	delete: (isBulk) =>
		isBulk
			? `They move to the trash, and are deleted permanently after ${TRASH_RETENTION_DAYS} days.`
			: `It moves to the trash, and is deleted permanently after ${TRASH_RETENTION_DAYS} days.`,
	archive: (isBulk) =>
		isBulk
			? "You can restore them later from the archive."
			: "You can restore it later from the archive.",
};

/**
 * build confirm copy - dynamically generates consistent,
 * grammatically correct wording for single and bulk confirmation
 * dialogs, centralizing copy to prevent divergence across call sites.
 */
export function buildConfirmCopy({
	action,
	subject,
	subjectPlural,
	count = 1,
	consequence,
}: ConfirmCopyInput): {
	title: string;
	description: string;
	confirmLabel: string;
} {
	const isBulk = count > 1;
	const plural = subjectPlural ?? `${subject}s`;
	const noun = isBulk ? `${count} ${plural}` : `this ${subject}`;

	const label = ACTION_LABEL[action];
	// The default consequence agrees with the count - "it moves to the trash"
	// versus "they move to the trash" - which a fixed string could not do.
	const tail = consequence ?? ACTION_CONSEQUENCE[action]?.(isBulk);

	return {
		// Sentence case and a question mark: the dialog is asking, and a title
		// that is not a question reads as an announcement the reader cannot refuse.
		title: `Are you sure you want to ${ACTION_VERB[action]} ${noun}?`,
		description: tail ?? "",
		// "Delete 3 projects" rather than "Confirm". The button restates what it
		// does, so someone who skimmed the title still cannot press it by accident.
		confirmLabel: isBulk ? `${label} ${count} ${plural}` : label,
	};
}
