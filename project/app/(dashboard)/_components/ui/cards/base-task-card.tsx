import { format } from "date-fns";
import {
	Calendar,
	CheckSquare,
	Flag,
	MessageSquare,
	Paperclip,
} from "lucide-react";
import { PriorityBadge } from "@/app/(dashboard)/_components/ui/badges/priority-badge";
import { TagBadge } from "@/app/(dashboard)/_components/ui/badges/tag-badge";
import type { TaskItem, TaskPriority, TaskTag } from "@/types/task";

export interface BaseTaskCardProps {
	task: Partial<TaskItem> & { title: string };
	headerAction?: React.ReactNode; // Right side of top row (e.g. Edit icon, Project badge)
	topHeaderLeft?: React.ReactNode; // Custom left side of top row (e.g. Due date text)
	showAvatar?: boolean; // Whether to render assignee avatar in footer
	dateFormat?: string; // Format string for date (default: "MMM d")
	onClick?: () => void;
	className?: string;
}

export function BaseTaskCard({
	task,
	headerAction,
	topHeaderLeft,
	showAvatar = true,
	dateFormat = "MMM d",
	onClick,
	className = "",
}: BaseTaskCardProps) {
	const formattedDate = task.date
		? format(new Date(task.date), dateFormat)
		: null;

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: We dynamically set role based on onClick
		<div
			onClick={onClick}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onClick?.();
				}
			}}
			role={onClick ? "button" : undefined}
			tabIndex={onClick ? 0 : undefined}
			className={`bg-surface border border-outline-variant p-4 rounded-lg flex flex-col gap-3 transition-colors shadow-sm group ${className}`}
		>
			{/* Top Header Row */}
			{(topHeaderLeft || task.priority || task.category || headerAction) && (
				<div className="flex justify-between items-start">
					<div className="flex items-center gap-2">
						{topHeaderLeft ? (
							topHeaderLeft
						) : (
							<>
								{task.priority && (
									<PriorityBadge
										priority={
											(task.priority.charAt(0).toUpperCase() +
												task.priority.slice(1).toLowerCase()) as TaskPriority
										}
									/>
								)}
								{task.category && (
									<TagBadge
										tag={
											(task.category.charAt(0).toUpperCase() +
												task.category.slice(1).toLowerCase()) as TaskTag
										}
									/>
								)}
							</>
						)}
					</div>
					{headerAction}
				</div>
			)}

			{/* Title */}
			<p className="font-body-sm text-body-sm text-foreground leading-tight font-medium group-hover:text-primary transition-colors">
				{task.title}
			</p>

			{/* Footer Metadata */}
			{(showAvatar ||
				task.comments ||
				task.attachments ||
				task.date ||
				task.priority === "high" ||
				task.tasksTotal) && (
				<div className="flex items-center justify-between mt-2 pt-3 border-t border-outline-variant/50">
					{showAvatar && (
						<div className="flex -space-x-2">
							<div className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-label-sm text-[10px] border border-surface">
								AJ
							</div>
						</div>
					)}

					<div
						className={`flex items-center gap-3 text-secondary text-xs ${
							!showAvatar ? "w-full justify-start" : ""
						}`}
					>
						{task.comments ? (
							<div className="flex items-center gap-1">
								<MessageSquare className="w-3.5 h-3.5" /> {task.comments}
							</div>
						) : null}
						{task.attachments ? (
							<div className="flex items-center gap-1">
								<Paperclip className="w-3.5 h-3.5" /> {task.attachments}
							</div>
						) : null}
						{!topHeaderLeft && formattedDate ? (
							<div className="flex items-center gap-1">
								<Calendar className="w-3.5 h-3.5" /> {formattedDate}
							</div>
						) : null}
						{task.priority === "high" ? (
							<div className="flex items-center gap-1 text-error">
								<Flag className="w-3.5 h-3.5" /> High
							</div>
						) : null}
						{task.tasksTotal ? (
							<div className="flex items-center gap-1">
								<CheckSquare className="w-3.5 h-3.5" /> {task.tasksCompleted}/
								{task.tasksTotal}
							</div>
						) : null}
					</div>
				</div>
			)}
		</div>
	);
}
