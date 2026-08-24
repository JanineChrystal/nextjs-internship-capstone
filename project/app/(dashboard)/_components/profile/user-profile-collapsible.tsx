"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { StatusBadge } from "@/app/(dashboard)/_components/ui/badges/status-badge";
import { TagBadge } from "@/app/(dashboard)/_components/ui/badges/tag-badge";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import type { ProfileProjectData } from "@/types/profile";
import type { TaskStatus } from "@/types/task";

export function UserProjectCollapsible({
	project,
}: {
	project: ProfileProjectData;
}) {
	const [isOpen, setIsOpen] = useState(false);

	/** zero-task guard - a shared project the person has no tasks in is now a real case, and dividing by zero would render "NaN%" and an empty progress bar. */
	const progressPercentage =
		project.totalTasks === 0
			? 0
			: Math.round((project.completedTasks / project.totalTasks) * 100);

	return (
		<Collapsible
			open={isOpen}
			onOpenChange={setIsOpen}
			className="bg-surface rounded-xl border border-outline-variant overflow-hidden transition-all shadow-sm hover:border-primary/40"
		>
			{/* collapsible trigger row */}
			<CollapsibleTrigger className="w-full p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left cursor-pointer hover:bg-surface-container-lowest/50 transition-colors">
				<div className="flex items-center gap-3">
					<ChevronDown
						className={`h-5 w-5 text-secondary transition-transform duration-200 ${
							isOpen ? "rotate-180" : ""
						}`}
					/>
					<div>
						<div className="flex flex-wrap items-center gap-2">
							<h3 className="text-base font-bold text-foreground">
								{project.title}
							</h3>

							{/* job title badge */}
							<TagBadge tag={project.jobRole} />

							{/* role access badge */}
							<TagBadge
								tag={project.roleAccess}
								className="text-[10px] capitalize flex items-center gap-1"
							/>
						</div>

						<p className="text-xs text-secondary mt-1">
							{project.completedTasks} of {project.totalTasks} tasks completed (
							{progressPercentage}%)
						</p>
					</div>
				</div>

				{/* progress bar container */}
				<div className="flex items-center gap-4 w-full sm:w-64 shrink-0">
					<Progress value={progressPercentage} className="h-2 flex-1" />
					<span className="text-xs font-semibold text-foreground w-10 text-right">
						{progressPercentage}%
					</span>
				</div>
			</CollapsibleTrigger>

			{/* assigned tasks list content */}
			<CollapsibleContent className="px-5 pb-5 pt-2 border-t border-outline-variant/50 bg-surface-container-lowest/30">
				<div className="space-y-2 mt-2">
					<h4 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3">
						Assigned Tasks ({project.tasks.length})
					</h4>

					{project.tasks.map((task) => (
						<div
							key={task.id}
							className="flex items-center justify-between p-3 bg-surface rounded-lg border border-outline-variant/40 hover:border-primary/30 transition-colors"
						>
							<div className="flex items-center gap-3">
								<span className="text-sm font-medium text-foreground">
									{task.name}
								</span>
							</div>

							<StatusBadge status={task.status as TaskStatus} />
						</div>
					))}
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}
