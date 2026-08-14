import type { TaskBoard } from "@/types/task";

export type IconName =
	| "clock"
	| "check-circle"
	| "circle"
	| "alert-triangle"
	| "chevrons-up"
	| "chevron-up"
	| "chevron-down";

export const STATUS_CONFIG: Record<string, { color: string; icon: IconName }> =
	{
		"In Progress": {
			color: "text-primary bg-primary/10 border-primary/20",
			icon: "clock",
		},
		Completed: {
			color:
				"text-green-700 bg-green-100 border-green-200 dark:text-green-400 dark:bg-green-900/30 dark:border-green-800/30",
			icon: "check-circle",
		},
		"Not Started": {
			color:
				"text-secondary bg-surface-container-high border-outline-variant/30",
			icon: "circle",
		},
		"To Do": {
			color:
				"text-secondary bg-surface-container-high border-outline-variant/30",
			icon: "circle",
		},
		active: {
			color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
			icon: "clock",
		},
		completed: {
			color:
				"text-green-700 bg-green-100 border-green-200 dark:text-green-400 dark:bg-green-900/30 dark:border-green-800/30",
			icon: "check-circle",
		},
		overdue: {
			color: "text-error bg-error/10 border-error/20",
			icon: "alert-triangle",
		},
		"on hold": {
			color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
			icon: "circle",
		},
	};

export const PRIORITY_CONFIG: Record<
	string,
	{ color: string; icon: IconName }
> = {
	Urgent: {
		color: "text-error",
		icon: "alert-triangle",
	},
	urgent: {
		color: "text-error",
		icon: "alert-triangle",
	},
	High: {
		color: "text-orange-600 dark:text-orange-400",
		icon: "chevrons-up",
	},
	high: {
		color: "text-orange-600 dark:text-orange-400",
		icon: "chevrons-up",
	},
	Medium: {
		color: "text-amber-500",
		icon: "chevron-up",
	},
	medium: {
		color: "text-amber-500",
		icon: "chevron-up",
	},
	Low: {
		color: "text-secondary",
		icon: "chevron-down",
	},
	low: {
		color: "text-secondary",
		icon: "chevron-down",
	},
};

export const TAG_CONFIG: Record<string, string> = {
	Design:
		"text-purple-700 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/30",
	Research: "text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30",
	Analytics:
		"text-orange-700 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/30",
	Content:
		"text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30",
};

export const DYNAMIC_BADGE_PALETTES = [
	"text-purple-700 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800/30",
	"text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/30",
	"text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/30",
	"text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800/30",
	"text-rose-700 bg-rose-100 dark:text-rose-300 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800/30",
	"text-indigo-700 bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800/30",
	"text-cyan-700 bg-cyan-100 dark:text-cyan-300 dark:bg-cyan-900/30 border-cyan-200 dark:border-cyan-800/30",
	"text-teal-700 bg-teal-100 dark:text-teal-300 dark:bg-teal-900/30 border-teal-200 dark:border-teal-800/30",
];

export function getDynamicBadgeColor(text: string): string {
	let hash = 0;
	for (let i = 0; i < text.length; i++) {
		hash = text.charCodeAt(i) + ((hash << 5) - hash);
	}
	const index = Math.abs(hash) % DYNAMIC_BADGE_PALETTES.length;
	return DYNAMIC_BADGE_PALETTES[index];
}

export const BOARD_CONFIG: Record<TaskBoard, string> = {
	"In Progress":
		"text-sky-700 bg-sky-100 border-sky-200 dark:text-sky-300 dark:bg-sky-950/40 dark:border-sky-800/30",
	Completed:
		"text-emerald-700 bg-emerald-100 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800/30",
	"Up Next":
		"text-indigo-700 bg-indigo-100 border-indigo-200 dark:text-indigo-300 dark:bg-indigo-950/40 dark:border-indigo-800/30",
	Backlog:
		"text-slate-700 bg-slate-100 border-slate-200 dark:text-slate-300 dark:bg-slate-800/40 dark:border-slate-700/30",
};
