import { Archive, Trash2 } from "lucide-react";
import Link from "next/link";
import { CategoryBadge } from "@/app/(dashboard)/_components/ui/badges/category-badge";
import { PriorityBadge } from "@/app/(dashboard)/_components/ui/badges/priority-badge";
import { StatusBadge } from "@/app/(dashboard)/_components/ui/badges/status-badge";
import { BaseCard } from "@/components/ui/cards/base-card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import type { Project } from "@/lib/validations/project-schema";

export function ProjectCard({
	project,
	isSelected = false,
	onToggleSelection,
	onDelete,
	onArchive,
}: {
	project: Project;
	isSelected?: boolean;
	onToggleSelection?: () => void;
	onDelete?: (id: string) => void;
	onArchive?: (id: string) => void;
}) {
	return (
		<Link
			href={`/projects/${project.id}`}
			className={`block h-full transition-transform hover:-translate-y-1 duration-200 group ${isSelected ? "ring-2 ring-primary rounded-xl" : ""}`}
		>
			<BaseCard
				className={`flex flex-col gap-4 h-full relative ${isSelected ? "bg-primary/5 border-primary/20" : ""}`}
			>
				<div className="flex justify-between items-center">
					<div className="flex items-center gap-2.5">
						{/* conditional checkbox visibility - keeps the checkbox visible only when hovered or actively selected to minimize visual noise. */}
						<div
							className={`transition-opacity duration-200 ${
								isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
							}`}
						>
							<Checkbox
								checked={isSelected}
								onCheckedChange={() => onToggleSelection?.()}
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									onToggleSelection?.();
								}}
								className="w-4 h-4 border-outline-variant data-[state=checked]:bg-primary data-[state=checked]:border-primary"
								aria-label={`Select ${project.title}`}
							/>
						</div>

						{/* status dot - displays a color-coded indicator representing the current project status. */}
						<div
							className={`w-2.5 h-2.5 rounded-full shrink-0 ${
								project.status === "active"
									? "bg-primary"
									: project.status === "completed"
										? "bg-green-500"
										: "bg-yellow-500"
							}`}
						/>
					</div>

					<div className="flex items-center gap-2">
						<span className="text-xs font-medium text-card-foreground/60 transition-all duration-200">
							{project.daysLeft} days left
						</span>

						{/* action layout ordering - places the reversible archive action before the destructive delete action for safer interactions. */}
						<button
							type="button"
							aria-label={`Archive ${project.title}`}
							onClick={(e) => {
								// click propagation barrier - prevents archive clicks from triggering the parent link navigation.
								e.preventDefault();
								e.stopPropagation();
								onArchive?.(project.id);
							}}
							className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
						>
							<Archive className="w-4 h-4" />
						</button>

						{/* delete button - triggers permanent project removal. */}
						<button
							type="button"
							aria-label={`Delete ${project.title}`}
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								onDelete?.(project.id);
							}}
							className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
						>
							<Trash2 className="w-4 h-4" />
						</button>
					</div>
				</div>

				{/* content block - renders the project title and a truncated description. */}
				<div>
					<h3 className="font-semibold text-lg mb-1">{project.title}</h3>
					<p className="text-sm text-card-foreground/70 line-clamp-2">
						{project.description}
					</p>
				</div>

				{/* meta badges container - groups category, status, and priority badges. */}
				<div className="flex flex-wrap items-center gap-2 mt-1">
					{/* category badge - displays the project's classification. */}
					{project.category && (
						<CategoryBadge
							name={project.category}
							// local workspace scope - defaults to the viewer's workspace categories to avoid expensive cross-workspace palette lookups.
							scope={{ kind: "workspace", id: "default", type: "project" }}
							className="uppercase"
						/>
					)}

					{/* status badge - displays the current workflow state. */}
					{project.status && (
						<StatusBadge status={project.status} className="uppercase" />
					)}

					{/* priority badge - highlights the project's urgency level. */}
					{project.priority && (
						<PriorityBadge priority={project.priority} className="uppercase" />
					)}
				</div>

				{/* metrics footer - shows member count, task completion stats, and a progress bar. */}
				<div className="mt-auto pt-4 flex flex-col gap-3">
					<div className="flex justify-between text-xs text-card-foreground/80 font-medium">
						<span>{project.membersCount} members</span>
						<span>
							{project.tasksCompleted ?? 0}/{project.tasksCount ?? 0} tasks
						</span>
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
