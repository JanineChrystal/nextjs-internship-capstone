import type { LucideIcon } from "lucide-react";
import type { Permission, RoleAccess } from "@/lib/types/member";

/**
 * project picker option - represents a minimal project projection optimized
 * for dropdowns, including pre-calculated role access to preemptively
 * disable unauthorized selections.
 */
export interface ProjectPickerOption {
	id: string;
	name: string;
	category: string | null;
	isOwned: boolean;
	roleAccess: RoleAccess;
}

/**
 * quick action id - union of all allowed dashboard shortcut identifiers,
 * ensuring exhaustive switch handling and compile-time validation for actions.
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
 * project picker copy - defines the text and permission rules for the
 * project picker step, binding the UI disabled state to the same permission
 * evaluated on the server.
 */
export interface ProjectPickerCopy {
	title: string;
	description: string;
	confirmLabel: string;
	requiredPermission: Permission;
	/** Shown on a row the user cannot use, saying why. */
	deniedHint: string;
}
