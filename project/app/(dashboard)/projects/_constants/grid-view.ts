import type { ColumnDef } from "@/types/grid-table";
import type { GridTask } from "@/types/task";

export const GRID_COLUMN_CLASSES = {
	checkbox: "w-10 shrink-0",
	taskName: "flex-1 min-w-[200px]",
	assignee: "w-40 shrink-0 flex justify-center",
	start: "w-24 shrink-0 flex justify-center",
	due: "w-24 shrink-0 flex justify-center",
	board: "w-32 shrink-0 flex justify-center",
	status: "w-36 shrink-0",
	priority: "w-28 shrink-0",
	tag: "w-28 shrink-0",
};

export const GRID_COLUMNS: ColumnDef[] = [
	{ key: "select", title: "", className: GRID_COLUMN_CLASSES.checkbox },
	{ key: "name", title: "Task Name", className: GRID_COLUMN_CLASSES.taskName },
	{
		key: "assignee",
		title: "Assignee",
		className: GRID_COLUMN_CLASSES.assignee,
	},
	{ key: "startDate", title: "Start", className: GRID_COLUMN_CLASSES.start },
	{ key: "dueDate", title: "Due", className: GRID_COLUMN_CLASSES.due },
	{ key: "board", title: "Board", className: GRID_COLUMN_CLASSES.board },
	{ key: "status", title: "Status", className: GRID_COLUMN_CLASSES.status },
	{
		key: "priority",
		title: "Priority",
		className: GRID_COLUMN_CLASSES.priority,
	},
	{ key: "tag", title: "Tag", className: GRID_COLUMN_CLASSES.tag },
];

export const mockTasks: GridTask[] = [
	{
		id: "1",
		name: "Finalize campaign creatives",
		assignees: [
			{
				name: "Sarah",
				avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
			},
		],
		startDate: "Oct 12",
		dueDate: "Oct 18",
		board: "In Progress",
		status: "In Progress",
		priority: "High",
		tag: "Design",
		isCompleted: false,
	},
	{
		id: "2",
		name: "Define target audience segments",
		assignees: [
			{
				name: "Mike",
				avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
			},
		],
		startDate: "Oct 01",
		dueDate: "Oct 05",
		board: "Completed",
		status: "Completed",
		priority: "Urgent",
		tag: "Research",
		isCompleted: true,
	},
	{
		id: "3",
		name: "Setup tracking dashboards",
		assignees: [
			{
				name: "Alex",
				avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
			},
		],
		startDate: "Oct 15",
		dueDate: "Oct 20",
		board: "Up Next",
		status: "Not Started",
		priority: "Medium",
		tag: "Analytics",
		isCompleted: false,
	},
	{
		id: "4",
		name: "Draft press release",
		assignees: [
			{
				name: "Emma",
				avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
			},
		],
		startDate: "--",
		dueDate: "Oct 25",
		board: "Backlog",
		status: "Not Started",
		priority: "Low",
		tag: "Content",
		isCompleted: false,
	},
];
