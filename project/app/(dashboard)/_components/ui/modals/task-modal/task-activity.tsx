"use client";

import { ActivityList } from "@/app/(dashboard)/_components/ui/activity/activity-list";
import { useTaskActivity } from "@/app/(dashboard)/projects/_hooks/use-task-activity";

interface TaskActivityProps {
	taskId: string | undefined;
	projectId: string | undefined;
	isActive: boolean;
}

/**
 * The Activity tab of the task side panel.
 *
 * Thin on purpose: it owns nothing but the fetch trigger and the empty-state
 * wording. The rows themselves come from ActivityList, the same component the
 * Project Activity section renders, so the two feeds cannot drift apart.
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
