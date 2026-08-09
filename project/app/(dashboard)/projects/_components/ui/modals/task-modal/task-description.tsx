import type { GridTask } from "@/types/task";

interface TaskDescriptionProps {
	taskData: Partial<GridTask>;
	setTaskData: (data: Partial<GridTask>) => void;
	handleChange: (updates: Partial<GridTask>) => void;
	isEditMode: boolean;
}

export function TaskDescription({
	taskData,
	setTaskData,
	handleChange,
	isEditMode,
}: TaskDescriptionProps) {
	return (
		<div className="space-y-3 pt-4 border-t border-outline-variant/50">
			<h3 className="text-sm font-semibold text-foreground">Notes</h3>
			<textarea
				value={taskData.description || ""}
				onChange={(e) =>
					setTaskData({ ...taskData, description: e.target.value })
				}
				onBlur={() =>
					isEditMode && handleChange({ description: taskData.description })
				}
				placeholder="Add detailed task description or notes here..."
				aria-label="Task description"
				className="w-full min-h-30 p-3 rounded-lg border border-outline-variant bg-transparent resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
			/>
		</div>
	);
}
