import type { LucideIcon } from "lucide-react";
import type { Permission, RoleAccess } from "@/lib/types/member";

/**
 * One project as the "which project?" picker needs it.
 *
 * Deliberately much smaller than the project DTO: the picker shows a name, a
 * category and whether you own it, and sending the whole row - description,
 * dates, counts - would ship a page's worth of data to render a list of names.
 *
 * `roleAccess` is the one role that governs this user on this project, already
 * collapsed across every route they hold it by. It is here so the picker can
 * disable a project the action would be refused on, instead of letting someone
 * pick it, fill in a form and only then be told no.
 */
export interface ProjectPickerOption {
	id: string;
	name: string;
	category: string | null;
	isOwned: boolean;
	roleAccess: RoleAccess;
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

/**
 * What the "which project?" step needs to know about the action behind it.
 *
 * `requiredPermission` is what the picker greys rows out by. It names the same
 * permission the server will check, so the two cannot drift into disagreeing
 * about which projects are usable - the disabled row and the refusal are two
 * readings of one rule, not two rules.
 */
export interface ProjectPickerCopy {
	title: string;
	description: string;
	confirmLabel: string;
	requiredPermission: Permission;
	/** Shown on a row the user cannot use, saying why. */
	deniedHint: string;
}
