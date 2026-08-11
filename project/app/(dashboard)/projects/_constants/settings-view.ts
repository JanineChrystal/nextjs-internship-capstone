import type { ColumnDef } from "@/types/grid-table";
import type { FlaggedCommentItem, ProjectMember } from "@/types/member";
import type { DangerZoneActionConfig } from "@/types/project";

// This would be fetched from auth context later on
export const mockCurrentUserRole = "owner";

// Immutable static fallbacks to prevent Zustand getSnapshot reference loops
export const emptyMembers: ProjectMember[] = [];
export const emptyComments: FlaggedCommentItem[] = [];

// Section text constants
export const settingsSectionTexts = {
	teamAccess: {
		title: "Team & Access",
		description: "Manage who has access to this project and their permissions.",
	},
	commentModeration: {
		title: "Comment Moderation",
		description:
			"Review and resolve comments flagged by users or automated filters.",
	},
	dangerZone: {
		title: "Danger Zone",
		description:
			"Destructive actions that permanently affect this project and its data.",
	},
};

// Column definitions for GridTable usages
export const TEAM_ACCESS_COLUMNS: ColumnDef[] = [
	{ key: "member", title: "Member", className: "flex-2 min-w-[200px]" },
	{ key: "position", title: "Position", className: "w-44" },
	{ key: "role", title: "Access Level", className: "w-44" },
	{ key: "status", title: "Status", className: "w-32" },
	{
		key: "actions",
		title: "Actions",
		className: "w-16 text-right justify-end",
	},
];

export const COMMENT_MODERATION_COLUMNS: ColumnDef[] = [
	{ key: "author", title: "Author", className: "w-44" },
	{ key: "comment", title: "Comment", className: "flex-1 min-w-[250px]" },
	{ key: "task", title: "Task", className: "w-40" },
	{ key: "reason", title: "Flag Reason", className: "w-48" },
	{
		key: "actions",
		title: "Actions",
		className: "w-28 text-right justify-end",
	},
];

export const DANGER_ZONE_ACTIONS: DangerZoneActionConfig[] = [
	{
		id: "archive",
		title: "Archive Project",
		description:
			"Mark this project as archived. It will be hidden from active dashboards but data remains intact.",
		isDestructive: false,
	},
	{
		id: "delete",
		title: "Delete Project",
		description:
			"Permanently delete this project, all tasks, comments, and member associations. This action cannot be undone.",
		isDestructive: true,
	},
];
