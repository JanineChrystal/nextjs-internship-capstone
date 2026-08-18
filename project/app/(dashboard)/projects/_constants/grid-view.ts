import {
	DEFAULT_TASK_CATEGORIES,
	TASK_PRIORITIES,
} from "@/lib/validations/task-schema";
import type { ColumnDef } from "@/types/grid-table";

export const GRID_COLUMN_CLASSES = {
	checkbox: "w-10 shrink-0",
	taskName: "flex-1 min-w-[200px]",
	// Assignee/priority/category are secondary on small screens - hide them
	// so the grid degrades to a leaner table instead of forcing a wide
	// horizontal scroll for every viewport.
	assignee: "hidden md:flex w-40 shrink-0 justify-center",
	start: "hidden sm:flex w-24 shrink-0 justify-center",
	due: "w-24 shrink-0 flex justify-center",
	status: "w-36 shrink-0",
	priority: "hidden md:block w-28 shrink-0",
	category: "hidden lg:block w-28 shrink-0",
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
	{ key: "status", title: "Status", className: GRID_COLUMN_CLASSES.status },
	{
		key: "priority",
		title: "Priority",
		className: GRID_COLUMN_CLASSES.priority,
	},
	{
		key: "category",
		title: "Category",
		className: GRID_COLUMN_CLASSES.category,
	},
];

export const GRID_DATE_CELLS = [
	{ id: "startDate" as const, className: GRID_COLUMN_CLASSES.start },
	{ id: "dueDate" as const, className: GRID_COLUMN_CLASSES.due },
];

export const GRID_DROPDOWN_CELLS = [
	{
		id: "status" as const,
		className: GRID_COLUMN_CLASSES.status,
		// options will be injected dynamically from board store
	},
	{
		id: "priority" as const,
		className: GRID_COLUMN_CLASSES.priority,
		options: TASK_PRIORITIES,
	},
	{
		id: "category" as const,
		className: GRID_COLUMN_CLASSES.category,
		options: DEFAULT_TASK_CATEGORIES,
	},
];
