import type { ColumnDef } from "@/lib/types/grid-table";

/**
 * The static half of the workspace directory table.
 *
 * The select column is listed here for its width and key only - its header is a
 * checkbox wired to component state, so the component injects `renderHeader`
 * rather than this file trying to hold a closure. Everything that genuinely is
 * fixed data lives here, which is the part that was being rebuilt on every
 * render and handing GridTable a new array each time.
 */
export const DIRECTORY_COLUMNS: ColumnDef[] = [
	{ key: "select", title: "", className: "w-12 flex-none", sortable: false },
	{ key: "name", title: "Username", sortable: true, className: "flex-2" },
	{ key: "email", title: "Email", sortable: true, className: "flex-2" },
	{ key: "jobRoles", title: "Roles", sortable: false, className: "flex-2" },
	{
		key: "projectCount",
		title: "Projects",
		sortable: true,
		className: "flex-1 justify-center",
	},
	{ key: "action", title: "", sortable: false, className: "w-12 flex-none" },
];
