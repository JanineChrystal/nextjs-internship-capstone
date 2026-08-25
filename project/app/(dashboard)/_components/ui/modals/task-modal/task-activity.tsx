"use client";

import { ActivityList } from "@/app/(dashboard)/_components/ui/activity/activity-list";
import { useTaskActivity } from "@/app/(dashboard)/projects/_hooks/use-task-activity";

interface TaskActivityProps {
	taskId: string | undefined;
	projectId: string | undefined;
	isActive: boolean;
}

/**
 * task activity panel - a thin wrapper component that triggers data fetching and
 * provides task-specific empty states, delegating rendering to the shared ActivityList component.
 */
export function TaskActivity({
	taskId,
	projectId,
	isActive,
}: TaskActivityProps) {
	const { items, isLoading } = useTaskActivity(taskId, projectId, isActive);

	return (
		<div className="flex-1 min-h-0 overflow-y-auto px-4">
			<ActivityList
				items={items}
				isLoading={isLoading}
				emptyMessage="Nothing has happened on this task yet."
				className="divide-y divide-outline-variant/60"
			/>
		</div>
	);
}
