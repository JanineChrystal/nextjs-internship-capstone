import type { ColumnDef } from "@/types/grid-table";
import type { GridTask } from "@/types/task";

export const gridColumnClasses = {
	checkbox: "w-10 shrink-0",
	taskName: "flex-1 min-w-[200px]",
	assignee: "w-24 shrink-0",
	start: "w-24 shrink-0",
	due: "w-24 shrink-0",
	board: "w-32 shrink-0",
	status: "w-36 shrink-0",
	priority: "w-28 shrink-0",
	tag: "w-28 shrink-0",
};

// We store pure data here. View layer will inject JSX where needed.
export const GRID_COLUMNS: ColumnDef[] = [
	{ key: "select", title: "", className: gridColumnClasses.checkbox },
	{ key: "name", title: "Task Name", className: gridColumnClasses.taskName },
	{ key: "assignee", title: "Assignee", className: gridColumnClasses.assignee },
	{ key: "start", title: "Start", className: gridColumnClasses.start },
	{ key: "due", title: "Due", className: gridColumnClasses.due },
	{ key: "board", title: "Board", className: gridColumnClasses.board },
	{ key: "status", title: "Status", className: gridColumnClasses.status },
	{ key: "priority", title: "Priority", className: gridColumnClasses.priority },
	{ key: "tag", title: "Tag", className: gridColumnClasses.tag },
];

export const MOCK_TASKS: GridTask[] = [
	{
		id: "1",
		name: "Finalize campaign creatives",
		assignee: {
			name: "Sarah",
			avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
		},
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
		assignee: {
			name: "Mike",
			avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
		},
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
		assignee: {
			name: "Alex",
			avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
		},
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
		assignee: {
			name: "Emma",
			avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
		},
		startDate: "--",
		dueDate: "Oct 25",
		board: "Backlog",
		status: "Not Started",
		priority: "Low",
		tag: "Content",
		isCompleted: false,
	},
];
