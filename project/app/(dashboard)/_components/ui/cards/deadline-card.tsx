import { format } from "date-fns";
import { Folder } from "lucide-react";
import { useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import type { CalendarDeadlineItem } from "@/types/calendar";
import { BaseTaskCard } from "./base-task-card";

interface DeadlineCardProps {
	item: CalendarDeadlineItem;
	isSelected?: boolean;
	onToggleSelect?: (item: CalendarDeadlineItem) => void;
	onClick?: (item: CalendarDeadlineItem) => void;
	onDoubleClick?: (item: CalendarDeadlineItem) => void;
}

export function DeadlineCard({
	item,
	isSelected,
	onToggleSelect,
	onClick,
	onDoubleClick,
}: DeadlineCardProps) {
	const isProject = item.type === "project";
	const dateValue = isProject ? item.dueDate : item.date;

	// Tasks with no due date carry the "--" placeholder, and stored values can
	// be malformed - format() throws on either, so parse defensively.
	const parsedDate =
		dateValue && dateValue !== "--" ? new Date(dateValue) : null;
	const formattedDate =
		parsedDate && !Number.isNaN(parsedDate.getTime())
			? format(parsedDate, "MMM do, yyyy")
			: "No Due Date";

	const topHeaderLeft = (
		<div className="text-xs font-semibold text-primary">{formattedDate}</div>
	);

	const headerAction = (
		<div className="flex items-center gap-2">
			{isProject && (
				<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-tertiary-container text-on-tertiary-container">
					<Folder className="w-3 h-3" /> Project
				</span>
			)}
			{onToggleSelect && (
				<Checkbox
					checked={isSelected}
					onCheckedChange={() => onToggleSelect(item)}
					onClick={(e) => e.stopPropagation()}
					className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground cursor-pointer"
					aria-label="Select item"
				/>
			)}
		</div>
	);

	const handleCardClick = useCallback(() => {
		onClick?.(item);
	}, [item, onClick]);

	const handleCardDoubleClick = useCallback(() => {
		onDoubleClick?.(item);
	}, [item, onDoubleClick]);

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
			onClick={handleCardClick}
			onDoubleClick={handleCardDoubleClick}
			className={`bg-surface-container transition-all cursor-pointer ${
				isSelected
					? "border-primary shadow-sm bg-primary/5 ring-1 ring-primary"
					: "border-outline-variant/50 hover:border-primary/50"
			}`}
		/>
	);
}
