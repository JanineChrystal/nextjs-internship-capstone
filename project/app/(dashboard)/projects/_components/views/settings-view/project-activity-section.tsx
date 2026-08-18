"use client";

import { ActivityList } from "@/app/(dashboard)/_components/ui/activity/activity-list";
import { SectionTitle } from "@/components/ui/sections";
import { useProjectActivity } from "../../../_hooks/use-project-activity";

interface ProjectActivitySectionProps {
	projectId: string;
}

/**
 * Everything that has happened on this project, newest first.
 *
 * Renders the same ActivityList the task modal's Activity tab uses - the rows
 * are identical, only the filter differs, so building a second layout here would
 * have guaranteed the two drifted apart.
 *
 * Visible to every member rather than owners only: the underlying read is gated
 * by project role, and a shared history that only some collaborators can see
 * defeats the point of having one.
 */
export function ProjectActivitySection({
	projectId,
}: ProjectActivitySectionProps) {
	const { items, isLoading } = useProjectActivity(projectId);

	return (
		<section className="bg-surface rounded-xl border border-outline-variant p-6 flex flex-col gap-6">
			<SectionTitle
				title="Project Activity"
				description="A record of what has changed on this project, and who changed it."
			/>

			<div className="max-h-96 overflow-y-auto pr-1">
				<ActivityList
					items={items}
					isLoading={isLoading}
					emptyMessage="No activity recorded on this project yet."
					className="divide-y divide-outline-variant/60"
				/>
			</div>
		</section>
	);
}
