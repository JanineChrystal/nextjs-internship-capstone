import { Button } from "@/components/ui/buttons/button";
import { Calendar } from "@/components/ui/calendar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { formatDate } from "@/lib/utils/date";
import type {
	GridTask,
	TaskBoard,
	TaskPriority,
	TaskStatus,
	TaskTag,
} from "@/types/task";
import { TASK_PROPERTIES_CONFIG } from "../../../../_constants/task-modal";
import { BoardBadge } from "../../badges/board-badge";
import { PriorityBadge } from "../../badges/priority-badge";
import { StatusBadge } from "../../badges/status-badge";
import { TagBadge } from "../../badges/tag-badge";

interface TaskPropertiesGridProps {
	isCommentsOpen: boolean;
	taskData: Partial<GridTask>;
	handleChange: (updates: Partial<GridTask>) => void;
}

export function TaskPropertiesGrid({
	isCommentsOpen,
	taskData,
	handleChange,
}: TaskPropertiesGridProps) {
	const renderBadge = (id: string, value: string) => {
		switch (id) {
			case "tag":
				return <TagBadge tag={value as TaskTag} />;
			case "status":
				return <StatusBadge status={value as TaskStatus} />;
			case "priority":
				return <PriorityBadge priority={value as TaskPriority} />;
			case "board":
				return <BoardBadge board={value as TaskBoard} />;
			default:
				return null;
		}
	};

	return (
		<div
			className={`grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 ${
				isCommentsOpen ? "md:grid-cols-3" : "md:grid-cols-6"
			}`}
		>
			{/* Dynamically Rendered Dropdowns */}
			{TASK_PROPERTIES_CONFIG.map((config) => (
				<div key={config.id} className="space-y-1">
					<span className="block text-xs font-medium text-secondary uppercase tracking-wider">
						{config.label}
					</span>
					<DropdownMenu>
						<DropdownMenuTrigger className="w-full focus:outline-none flex items-center justify-between p-2 rounded-md border border-outline-variant hover:bg-surface-variant transition-colors">
							{renderBadge(config.id, taskData[config.id] as string)}
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start">
							{config.options.map((option) => (
								<DropdownMenuItem
									key={option}
									onClick={() => handleChange({ [config.id]: option })}
								>
									{option}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			))}

			{/* Date Pickers */}
			<div className="space-y-1">
				<span className="block text-xs font-medium text-secondary uppercase tracking-wider">
					Start Date
				</span>
				<Popover>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							className="w-full justify-start font-normal h-9.5 px-2 py-2 border-outline-variant"
						>
							{formatDate(taskData.startDate)}
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-0" align="start">
						<Calendar
							mode="single"
							selected={
								taskData.startDate && taskData.startDate !== "--"
									? new Date(taskData.startDate)
									: undefined
							}
							onSelect={(date) =>
								date && handleChange({ startDate: date.toISOString() })
							}
							initialFocus
						/>
					</PopoverContent>
				</Popover>
			</div>
			<div className="space-y-1">
				<span className="block text-xs font-medium text-secondary uppercase tracking-wider">
					Due Date
				</span>
				<Popover>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							className="w-full justify-start font-normal h-9.5 px-2 py-2 border-outline-variant"
						>
							{formatDate(taskData.dueDate)}
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-0" align="start">
						<Calendar
							mode="single"
							selected={
								taskData.dueDate && taskData.dueDate !== "--"
									? new Date(taskData.dueDate)
									: undefined
							}
							onSelect={(date) =>
								date && handleChange({ dueDate: date.toISOString() })
							}
							initialFocus
						/>
					</PopoverContent>
				</Popover>
			</div>
		</div>
	);
}
