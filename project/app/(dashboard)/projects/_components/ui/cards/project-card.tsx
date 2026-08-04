import { Trash2 } from "lucide-react";
import Link from "next/link";
import { BaseCard } from "@/components/ui/cards/base-card";
import { Progress } from "@/components/ui/progress";
import type { Project } from "@/lib/validations/project-schema";

export function ProjectCard({
	project,
	isSelectMode = false,
	onDelete,
}: {
	project: Project;
	isSelectMode?: boolean;
	onDelete?: (id: string) => void;
}) {
	return (
		<Link
			href={`/projects/${project.id}`}
			className="block h-full transition-transform hover:-translate-y-1 duration-200 group"
		>
			<BaseCard className="flex flex-col gap-4 h-full">
				<div className="flex justify-between items-center">
					{/* Status Dot */}
					<div
						className={`w-3 h-3 rounded-full ${
							project.status === "active"
								? "bg-primary"
								: project.status === "completed"
									? "bg-green-500"
									: "bg-yellow-500"
						}`}
					/>

					<div className="flex items-center gap-2">
						<span
							className={`text-xs font-medium text-card-foreground/60 transition-all duration-200 ${isSelectMode ? "mr-8" : ""}`}
						>
							{project.daysLeft} days left
						</span>

						{/* Delete Button */}
						{!isSelectMode && (
							<button
								type="button"
								aria-label="Delete project"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									onDelete?.(project.id);
								}}
								className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
							>
								<Trash2 className="w-4 h-4" />
							</button>
						)}
					</div>
				</div>

				{/* Title & Description */}
				<div>
					<h3 className="font-semibold text-lg mb-1">{project.title}</h3>
					<p className="text-sm text-card-foreground/70 line-clamp-2">
						{project.description}
					</p>
				</div>

				{/* Meta Badges (Category, Status, Priority) */}
				<div className="flex flex-wrap items-center gap-2 mt-1">
					{/* Category Badge */}
					<span className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-[10px] font-semibold uppercase tracking-wider">
						{project.category}
					</span>

					{/* Status Badge */}
					<span
						className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${
							project.status === "active"
								? "bg-blue-500/10 text-blue-500"
								: project.status === "completed"
									? "bg-green-500/10 text-green-500"
									: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
						}`}
					>
						{project.status}
					</span>

					{/* Priority Badge */}
					<span
						className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${
							project.priority === "high"
								? "bg-destructive/10 text-destructive"
								: "bg-muted text-muted-foreground"
						}`}
					>
						{project.priority} Priority
					</span>
				</div>

				{/* Metrics & Progress */}
				<div className="mt-auto pt-4 flex flex-col gap-3">
					<div className="flex justify-between text-xs text-card-foreground/80 font-medium">
						<span>{project.membersCount} members</span>
						<span>{project.tasksCount} tasks</span>
					</div>
					<Progress
						value={project.progress}
						className="h-2 [&>div]:bg-primary"
					/>
				</div>
			</BaseCard>
		</Link>
	);
}
