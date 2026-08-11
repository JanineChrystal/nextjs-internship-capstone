"use client";

import { AlertCircle, X } from "lucide-react";
import { useState } from "react";
import { DeadlineCard } from "@/app/(dashboard)/_components/ui/cards/deadline-card";
import { BulkActionBar } from "@/app/(dashboard)/projects/_components/views/grid-view/bulk-action-bar";
import type { CalendarDeadlineItem } from "@/types/calendar";

interface CalendarSidePanelProps {
	title?: string;
	items: CalendarDeadlineItem[];
	onItemClick?: (item: CalendarDeadlineItem) => void;
	onItemDoubleClick?: (item: CalendarDeadlineItem) => void;
}

export function CalendarSidePanel({
	title = "Upcoming Deadlines",
	items,
	onItemClick,
	onItemDoubleClick,
}: CalendarSidePanelProps) {
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [alertMessage, setAlertMessage] = useState<string | null>(null);

	const handleToggleSelect = (item: CalendarDeadlineItem) => {
		const newSelected = new Set(selectedIds);
		if (newSelected.has(item.id)) {
			newSelected.delete(item.id);
		} else {
			newSelected.add(item.id);
		}
		setSelectedIds(newSelected);
		setAlertMessage(null);
	};

	const handleClearSelection = () => {
		setSelectedIds(new Set());
		setAlertMessage(null);
	};

	const checkProjectSafety = (action: string) => {
		const selectedItems = items.filter((item) => selectedIds.has(item.id));
		const hasProject = selectedItems.some((item) => item.type === "project");

		if (hasProject) {
			setAlertMessage(
				`Cannot bulk ${action} projects. Please remove projects from your selection.`,
			);
			return false;
		}
		return true;
	};

	const handleBulkDelete = () => {
		if (!checkProjectSafety("delete")) return;
		// TODO: Implement actual store deletion
		console.log("Delete tasks:", Array.from(selectedIds));
		handleClearSelection();
	};

	const handleBulkComplete = () => {
		if (!checkProjectSafety("complete")) return;
		// TODO: Implement actual store completion
		console.log("Complete tasks:", Array.from(selectedIds));
		handleClearSelection();
	};

	return (
		<div className="xl:col-span-1 bg-surface rounded-xl border border-outline-variant p-6 h-187.5 relative flex flex-col">
			<div className="flex items-center justify-between mb-6">
				<h3 className="text-lg font-bold text-foreground">{title}</h3>
			</div>

			{alertMessage && (
				<div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-md flex items-start gap-3">
					<AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
					<p className="text-sm text-error flex-1">{alertMessage}</p>
					<button
						type="button"
						onClick={() => setAlertMessage(null)}
						className="text-error/70 hover:text-error transition-colors"
					>
						<X className="w-4 h-4" />
					</button>
				</div>
			)}

			<div className="flex flex-col gap-4 overflow-y-auto flex-1 min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
				{items.length > 0 ? (
					items.map((item) => (
						<DeadlineCard
							key={item.id}
							item={item}
							isSelected={selectedIds.has(item.id)}
							onToggleSelect={handleToggleSelect}
							onClick={onItemClick}
							onDoubleClick={onItemDoubleClick}
						/>
					))
				) : (
					<div className="text-center text-sm text-secondary py-8">
						No upcoming items scheduled.
					</div>
				)}
			</div>

			<BulkActionBar
				selectedCount={selectedIds.size}
				onClearSelection={handleClearSelection}
				onDelete={handleBulkDelete}
				onComplete={handleBulkComplete}
			/>
		</div>
	);
}
