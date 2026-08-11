import { format } from "date-fns";
import { Folder } from "lucide-react";
import type { CalendarDeadlineItem } from "@/types/calendar";
import { BaseTaskCard } from "./base-task-card";

interface DeadlineCardProps {
	item: CalendarDeadlineItem;
	onClick?: (item: CalendarDeadlineItem) => void;
}

export function DeadlineCard({ item, onClick }: DeadlineCardProps) {
	const isProject = item.type === "project";
	const dateValue = isProject ? item.dueDate : item.date;

	const formattedDate = dateValue
		? format(new Date(dateValue), "MMM do, yyyy")
		: "No Due Date";

	const topHeaderLeft = (
		<div className="text-xs font-semibold text-primary">{formattedDate}</div>
	);

	const headerAction = isProject ? (
		<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-tertiary-container text-on-tertiary-container">
			<Folder className="w-3 h-3" /> Project
		</span>
	) : undefined;

	return (
		<BaseTaskCard
			task={{
				title: item.title,
				priority: item.priority,
				category: item.category,
				comments: !isProject ? item.comments : undefined,
				attachments: !isProject ? item.attachments : undefined,
				tasksCompleted: !isProject ? item.tasksCompleted : undefined,
				tasksTotal: !isProject ? item.tasksTotal : undefined,
			}}
			topHeaderLeft={topHeaderLeft}
			headerAction={headerAction}
			showAvatar={false}
			onClick={() => onClick?.(item)}
			className="bg-surface-container border-outline-variant/50 hover:border-primary/50 cursor-pointer"
		/>
	);
}
