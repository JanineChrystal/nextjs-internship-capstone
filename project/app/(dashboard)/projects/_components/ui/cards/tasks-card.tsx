import {
	CheckSquare,
	Flag,
	MessageSquare,
	MoreHorizontal,
	Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/buttons/button";
import { cn } from "@/lib/utils";

interface TaskCardProps {
	title: string;
	tag: string;
	tagColor?: "default" | "urgent" | "development";
	comments?: number;
	attachments?: number;
	date?: string;
	priority?: "High" | "Medium" | "Low";
	progress?: { completed: number; total: number };
}

export function TaskCard({
	title,
	tag,
	tagColor = "default",
	comments,
	attachments,
	date,
	priority,
	progress,
}: TaskCardProps) {
	const tagStyles = {
		default: "bg-secondary/10 text-secondary-foreground",
		urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
		development:
			"bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
	};

	return (
		<div className="bg-card border border-border p-4 rounded-lg flex flex-col gap-3 hover:border-primary/50 transition-colors cursor-pointer shadow-sm group">
			<div className="flex justify-between items-start">
				<span
					className={cn(
						"px-2 py-1 font-semibold text-[10px] rounded-md uppercase tracking-wider",
						tagStyles[tagColor],
					)}
				>
					{tag}
				</span>
				<Button className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
					<MoreHorizontal className="w-4 h-4" />
				</Button>
			</div>

			<p className="font-medium text-sm leading-tight text-foreground">
				{title}
			</p>

			{/* Progress Bar (if applicable) */}
			{progress && (
				<div className="w-full h-1.5 bg-secondary rounded-full mt-1 overflow-hidden">
					<div
						className="h-full bg-primary rounded-full"
						style={{ width: `${(progress.completed / progress.total) * 100}%` }}
					/>
				</div>
			)}

			<div className="flex items-center justify-between mt-2 pt-3 border-t border-border/50">
				{/* Avatar Placeholder */}
				<div className="flex -space-x-2">
					<div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold z-10 border-2 border-card">
						JD
					</div>
				</div>

				{/* Metrics */}
				<div className="flex items-center gap-3 text-muted-foreground text-xs">
					{comments && (
						<div className="flex items-center gap-1">
							<MessageSquare className="w-3.5 h-3.5" /> {comments}
						</div>
					)}
					{attachments && (
						<div className="flex items-center gap-1">
							<Paperclip className="w-3.5 h-3.5" /> {attachments}
						</div>
					)}
					{progress && (
						<div className="flex items-center gap-1">
							<CheckSquare className="w-3.5 h-3.5" /> {progress.completed}/
							{progress.total}
						</div>
					)}
					{priority === "High" && (
						<div className="flex items-center gap-1 text-red-500">
							<Flag className="w-3.5 h-3.5" /> High
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
