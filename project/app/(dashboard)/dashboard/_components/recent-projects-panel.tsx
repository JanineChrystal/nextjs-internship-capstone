import { FolderOpen } from "lucide-react";
import Link from "next/link";
import { BaseCard } from "@/components/ui/cards/base-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import type { RecentProjectDTO } from "@/lib/dtos/analytics-dto";

interface RecentProjectsPanelProps {
	projects: RecentProjectDTO[];
}

/**
 * recent projects panel - displays up to five active projects featuring a
 * true ARIA-labelled progress meter instead of a chart for accessibility.
 */
export function RecentProjectsPanel({ projects }: RecentProjectsPanelProps) {
	return (
		<BaseCard className="hover:scale-100 gap-4">
			<div className="flex items-baseline justify-between gap-3">
				<h2 className="text-base font-semibold text-on-surface">
					Recent Projects
				</h2>
				<Link
					href="/projects"
					className="text-xs text-primary hover:underline shrink-0"
				>
					View all
				</Link>
			</div>

			{projects.length === 0 ? (
				<EmptyState
					subdued
					icon={FolderOpen}
					title="No projects yet"
					description="Create your first project and its progress will appear here."
				/>
			) : (
				<ul className="flex flex-col gap-1">
					{projects.map((project) => (
						<li key={project.id}>
							<Link
								href={`/projects/${project.id}`}
								className="flex items-center gap-4 rounded-lg p-3 hover:bg-surface-container transition-colors"
							>
								<div className="min-w-0 flex-1">
									<p className="text-sm font-medium text-on-surface truncate">
										{project.name}
									</p>
									<p className="text-xs text-secondary tabular-nums">
										{project.completedTasks} of {project.totalTasks} tasks done
									</p>
								</div>

								<div className="flex items-center gap-2 shrink-0">
									{/* accessible progress bar - utilizes the Radix primitive instead of raw divs to guarantee correct ARIA roles and values. */}
									<Progress
										value={project.progress}
										className="h-2 w-20"
										aria-label={`${project.name} progress`}
									/>
									<span className="text-xs text-secondary tabular-nums w-9 text-right">
										{project.progress}%
									</span>
								</div>
							</Link>
						</li>
					))}
				</ul>
			)}
		</BaseCard>
	);
}
