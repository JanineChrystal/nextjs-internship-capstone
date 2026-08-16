import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Edit2, Trash2 } from "lucide-react";

export const projectPriorityOptions = [
	{ label: "Low", value: "low" },
	{ label: "Medium", value: "medium" },
	{ label: "High", value: "high" },
	{ label: "Urgent", value: "urgent" },
];

export interface ColumnActionConfig {
	id: "rename" | "delete" | "set-completion";
	label: string;
	icon: LucideIcon;
	variant?: "danger" | "default";
}

export const COLUMN_DROPDOWN_ACTIONS: ColumnActionConfig[] = [
	{
		id: "rename",
		label: "Rename Board",
		icon: Edit2,
	},
	{
		// Designates where completed tasks are moved. Flag-based, so this board
		// stays renameable without breaking completion.
		id: "set-completion",
		label: "Set as completion column",
		icon: CheckCircle2,
	},
	{
		id: "delete",
		label: "Delete Board",
		icon: Trash2,
		variant: "danger",
	},
];

export const TASK_CARD_FOOTER_METRICS = [
	{ id: "attachments" as const, icon: "Paperclip" as const },
	{ id: "checklist" as const, icon: "CheckSquare" as const },
	{ id: "date" as const, icon: "Calendar" as const },
];
