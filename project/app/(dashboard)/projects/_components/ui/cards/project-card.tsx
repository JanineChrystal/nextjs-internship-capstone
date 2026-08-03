import { BaseCard } from "@/components/ui/cards/base-card";
import { Progress } from "@/components/ui/progress";
import type { Project } from "@/lib/validations/project-schema";

export function ProjectCard({ project }: { project: Project }) {
	return (
		<BaseCard className="flex flex-col gap-4 h-full">
			{/* Status Dot & Days Left */}
			<div className="flex justify-between items-center">
				<div className="w-3 h-3 rounded-full bg-primary" />
				<span className="text-xs font-medium text-card-foreground/60">
					{project.daysLeft} days left
				</span>
			</div>

			{/* Title & Description */}
			<div>
				<h3 className="font-semibold text-lg mb-1">{project.title}</h3>
				<p className="text-sm text-card-foreground/70 line-clamp-2">
					{project.description}
				</p>
			</div>

			{/* Metrics & Progress */}
			<div className="mt-auto pt-4 flex flex-col gap-3">
				<div className="flex justify-between text-xs text-card-foreground/80 font-medium">
					<span>{project.membersCount} members</span>
					<span>{project.tasksCount} tasks</span>
				</div>
				<Progress value={project.progress} className="h-2 [&>div]:bg-primary" />
			</div>
		</BaseCard>
	);
}
