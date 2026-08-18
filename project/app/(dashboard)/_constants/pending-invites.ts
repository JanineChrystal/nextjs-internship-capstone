import type { ColumnDef } from "@/lib/types/grid-table";

/**
 * Columns for the pending-invite table in project settings, where every invite
 * is for the project already on screen.
 */
export const PENDING_INVITE_COLUMNS: ColumnDef[] = [
	{ key: "email", title: "Email", className: "flex-2 min-w-[220px]" },
	{ key: "position", title: "Position", className: "w-40" },
	{ key: "accessLevel", title: "Access Level", className: "w-36" },
	{ key: "invitedAt", title: "Invited", className: "w-32" },
	{ key: "actions", title: "", className: "w-16 text-right justify-end" },
];

/**
 * The same table on the team page's Pending view, which spans the whole
 * workspace and so has to name the project each invite is for.
 *
 * Two constants rather than one function of a flag: both shapes are fixed data,
 * and building either inside the component handed GridTable a brand-new array on
 * every render.
 */
export const PENDING_INVITE_COLUMNS_WITH_PROJECT: ColumnDef[] = [
	{ key: "email", title: "Email", className: "flex-2 min-w-[220px]" },
	{ key: "project", title: "Project", className: "w-48" },
	{ key: "position", title: "Position", className: "w-40" },
	{ key: "accessLevel", title: "Access Level", className: "w-36" },
	{ key: "invitedAt", title: "Invited", className: "w-32" },
	{ key: "actions", title: "", className: "w-16 text-right justify-end" },
];
