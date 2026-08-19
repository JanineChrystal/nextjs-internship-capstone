import type { LucideIcon } from "lucide-react";

/**
 * One project as the "which project?" picker needs it.
 *
 * Deliberately much smaller than the project DTO: the picker shows a name, a
 * category and whether you own it, and sending the whole row - description,
 * dates, counts - would ship a page's worth of data to render a list of names.
 */
export interface ProjectPickerOption {
	id: string;
	name: string;
	category: string | null;
	isOwned: boolean;
}

/**
 * The four dashboard shortcuts.
 *
 * A union rather than free-text ids, so the panel's switch has to handle every
 * one of them - adding a fifth without wiring it up becomes a compile error
 * rather than a button that silently does nothing, which is exactly how the
 * previous version of this panel shipped three dead buttons.
 */
export type QuickActionId =
	| "create-project"
	| "create-task"
	| "add-workspace-member"
	| "add-project-member";

export interface QuickAction {
	id: QuickActionId;
	label: string;
	description: string;
	icon: LucideIcon;
	/** True when the action has to ask which project first. */
	needsProject: boolean;
}
