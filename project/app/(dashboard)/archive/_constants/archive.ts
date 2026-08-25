import type { ArchiveOperation } from "@/lib/dal/archive";
import type { TabOption } from "@/lib/types/nav";

export type ArchiveTab = "archive" | "trash";

export const ARCHIVE_TABS: readonly TabOption<ArchiveTab>[] = [
	{ label: "Archive", value: "archive" },
	{ label: "Trash", value: "trash" },
];

/**
 * The two buttons each tab offers, and what each one does.
 *
 * Config rather than JSX so the two tabs render through one component: the rows
 * are identical, only the pair of actions differs. `confirm` marks the ones that
 * open a confirmation dialog first - which is exactly the operations that cannot
 * be undone.
 */
export interface ArchiveActionConfig {
	operation: ArchiveOperation;
	label: string;
	variant: "default" | "destructive";
	confirm?: {
		title: string;
		description: string;
		confirmText: string;
	};
	successMessage: string;
}

export const ARCHIVE_TAB_ACTIONS: Record<ArchiveTab, ArchiveActionConfig[]> = {
	archive: [
		{
			operation: "unarchive",
			label: "Unarchive",
			variant: "default",
			successMessage: "Restored from archive",
		},
		{
			operation: "trash",
			label: "Move to trash",
			variant: "destructive",
			// No confirmation: this is reversible from the very next tab, and a
			// dialog in front of a reversible action trains people to dismiss the
			// ones that matter.
			successMessage: "Moved to trash",
		},
	],
	trash: [
		{
			operation: "restore",
			label: "Restore",
			variant: "default",
			successMessage: "Restored",
		},
		{
			operation: "purge",
			label: "Delete permanently",
			variant: "destructive",
			confirm: {
				title: "Delete permanently?",
				description:
					"This removes the item and everything inside it from the database. It cannot be undone.",
				confirmText: "Delete permanently",
			},
			successMessage: "Deleted permanently",
		},
	],
};
