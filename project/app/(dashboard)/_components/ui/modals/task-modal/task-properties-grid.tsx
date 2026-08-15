import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/buttons/button";
import { Calendar } from "@/components/ui/calendar";
import { CreatableCombobox } from "@/components/ui/combobox/creatable-combobox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ManageCategoriesModal } from "@/components/ui/modals/manage-categories-modal";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useBoardStore } from "@/stores/use-board-store";
import { useCategoryStore } from "@/stores/use-category-store";
import type {
	GridTask,
	TaskBoard,
	TaskPriority,
	TaskStatus,
} from "@/types/task";
import {
	DATE_PICKER_CONFIG,
	TASK_PROPERTIES_CONFIG,
} from "../../../../projects/_constants/task-modal";
import { BoardBadge } from "../../badges/board-badge";
import { PriorityBadge } from "../../badges/priority-badge";

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
	const boardColumns = useBoardStore((state) => state.columns);
	const { categories, fetchCategories } = useCategoryStore();
	const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);

	useEffect(() => {
		fetchCategories("default", "task");
	}, [fetchCategories]);

	const dynamicStatuses = useMemo(
		() => boardColumns.map((col) => col.title),
		[boardColumns],
	);

	const propertiesConfig = useMemo(() => {
		return TASK_PROPERTIES_CONFIG.map((config) => {
			if (config.id === "board") {
				return { ...config, options: dynamicStatuses };
			}
			return config;
		});
	}, [dynamicStatuses]);

	const renderBadge = (id: string, value: string) => {
		switch (id) {
			case "priority":
				return <PriorityBadge priority={value as TaskPriority} />;
			case "board":
				return <BoardBadge board={value as TaskBoard} />;
			default:
				return null;
		}
	};

	const formatDateTime = (value: string | undefined) => {
		if (!value || value === "--") return "--";
		try {
			return format(new Date(value), "MMM d, yyyy h:mm a");
		} catch {
			return value;
		}
	};

	const getTimeInputValue = (value: string | undefined) => {
		if (!value || value === "--") return "";
		const date = new Date(value);
		return `${String(date.getHours()).padStart(2, "0")}:${String(
			date.getMinutes(),
		).padStart(2, "0")}`;
	};

	const handleDateSelect = (
		fieldId: "startDate" | "dueDate",
		date: Date | undefined,
	) => {
		if (!date) return;
		const existing = taskData[fieldId];
		if (existing && existing !== "--") {
			const previous = new Date(existing);
			date.setHours(previous.getHours(), previous.getMinutes(), 0, 0);
		}
		handleChange({ [fieldId]: date.toISOString() });
	};

	const handleTimeChange = (
		fieldId: "startDate" | "dueDate",
		timeValue: string,
	) => {
		if (!timeValue) return;
		const existing = taskData[fieldId];
		const base =
			existing && existing !== "--" ? new Date(existing) : new Date();
		const [hours, minutes] = timeValue.split(":").map(Number);
		base.setHours(hours, minutes, 0, 0);
		handleChange({ [fieldId]: base.toISOString() });
	};

	return (
		<div
			className={`grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 ${
				isCommentsOpen ? "md:grid-cols-3" : "md:grid-cols-6"
			}`}
		>
			{/* Category - user-manageable via CreatableCombobox, like project category */}
			<div className="space-y-1">
				<span className="block text-xs font-medium text-secondary uppercase tracking-wider">
					Category
				</span>
				<CreatableCombobox
					options={categories.map((c) => ({
						value: c.name,
						label: c.name,
						color: c.color,
					}))}
					value={taskData.category}
					onChange={(val) => handleChange({ category: val })}
					placeholder="Select or create..."
					onManageClick={() => setIsManageCategoriesOpen(true)}
				/>
			</div>

			{/* Dynamically Rendered Dropdowns (Board, Priority) */}
			{propertiesConfig.map((config) => (
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
									onClick={() => {
										const updates: Partial<GridTask> = { [config.id]: option };
										if (config.id === "board") {
											updates.status = option as TaskStatus;
										}
										handleChange(updates);
									}}
								>
									{option}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			))}

			{/* Date Pickers mapped from constants */}
			{DATE_PICKER_CONFIG.map((datePicker) => (
				<div key={datePicker.id} className="space-y-1">
					<span className="block text-xs font-medium text-secondary uppercase tracking-wider">
						{datePicker.label}
					</span>
					<Popover>
						<PopoverTrigger asChild>
							<Button
								type="button"
								variant="outline"
								className="w-full justify-start font-normal h-9.5 px-2 py-2 border-outline-variant"
							>
								{formatDateTime(taskData[datePicker.id])}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
							<Calendar
								mode="single"
								selected={
									taskData[datePicker.id] && taskData[datePicker.id] !== "--"
										? new Date(taskData[datePicker.id] as string)
										: undefined
								}
								onSelect={(date) => handleDateSelect(datePicker.id, date)}
								initialFocus
							/>
							<div className="p-3 border-t border-outline-variant">
								<label
									htmlFor={`${datePicker.id}-time`}
									className="block text-xs font-medium text-secondary uppercase tracking-wider mb-1"
								>
									Time
								</label>
								<input
									id={`${datePicker.id}-time`}
									type="time"
									value={getTimeInputValue(taskData[datePicker.id])}
									onChange={(e) =>
										handleTimeChange(datePicker.id, e.target.value)
									}
									className="w-full h-9 px-2 rounded-md border border-outline-variant bg-transparent text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
								/>
							</div>
						</PopoverContent>
					</Popover>
				</div>
			))}

			<ManageCategoriesModal
				isOpen={isManageCategoriesOpen}
				onClose={() => setIsManageCategoriesOpen(false)}
				type="task"
				workspaceId="default"
			/>
		</div>
	);
}
