import { TRASH_RETENTION_DAYS } from "@/lib/constants/archive";
import type { ConfirmAction, ConfirmCopyInput } from "@/lib/types/feedback";

/** The verb as it appears in the question and on the confirm button. */
const ACTION_VERB: Record<ConfirmAction, string> = {
	create: "create",
	edit: "save changes to",
	delete: "delete",
	archive: "archive",
	complete: "complete",
};

/** The confirm button's label. Repeats the verb, never says "OK". */
const ACTION_LABEL: Record<ConfirmAction, string> = {
	create: "Create",
	edit: "Save changes",
	delete: "Delete",
	archive: "Archive",
	complete: "Complete",
};

/**
 * Consequences the reader should be told without every call site remembering.
 *
 * Only where one genuinely exists. A create confirmation that warns "this
 * cannot be undone" is both false and alarming, and a product that cries wolf
 * on every dialog trains people to click through the one that mattered.
 *
 * ## Why delete does not say "this cannot be undone"
 *
 * Because in this app it can. Both `deleteProjectsInDB` and the task deletes
 * set `deletedAt` rather than removing the row, and the archive page lists
 * those rows as trash with a restore action for `TRASH_RETENTION_DAYS`. Telling
 * someone the deletion is permanent is simply untrue, and the cost is not only
 * inaccuracy: a reader who believes it will hesitate over something reversible,
 * and will trust the warning less when they later discover the item was
 * recoverable all along.
 *
 * The retention window is interpolated rather than typed as "30", so this
 * sentence cannot drift away from the constant the purge actually runs on.
 *
 * The archive page's own "Delete permanently" action is the genuinely
 * irreversible one, and it carries its own copy in
 * `app/(dashboard)/archive/_constants/archive.ts` rather than coming through
 * here.
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
 * Builds the wording for a confirmation dialog, single or bulk.
 *
 * ## Why the copy is generated rather than typed at each call site
 *
 * The same question was being written by hand in fourteen places, and they had
 * already diverged: one asked about "3 selected project(s)" - parenthesised
 * plural and all - another said "this project", and the consequence sentence
 * appeared on some deletes and not others. Generating it means the bulk case is
 * automatically correct everywhere, and improving the wording is one edit.
 *
 * Pluralisation is passed in rather than derived. English plurals are not a
 * rule you can compute - "category" and "person" both break the obvious one -
 * and silently rendering "3 categorys" in front of a review panel is a worse
 * outcome than one extra prop.
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
