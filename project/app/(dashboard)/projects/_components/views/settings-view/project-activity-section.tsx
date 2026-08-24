"use client";

import { ActivityList } from "@/app/(dashboard)/_components/ui/activity/activity-list";
import { SectionTitle } from "@/components/ui/sections";
import { useProjectActivity } from "../../../_hooks/use-project-activity";

interface ProjectActivitySectionProps {
	projectId: string;
}

/**
 * project activity section - displays a chronological history of project events,
 * reusing the core activity list component and making it visible to all members
 * to maintain a shared understanding of project progress.
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
