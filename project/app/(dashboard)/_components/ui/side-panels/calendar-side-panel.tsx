"use client";

import { AlertCircle, X } from "lucide-react";
import { DeadlineCard } from "@/app/(dashboard)/_components/ui/cards/deadline-card";
import { WarningModal } from "@/app/(dashboard)/_components/ui/modals/warning-modal";
import { BulkActionBar } from "@/app/(dashboard)/_components/ui/toolbar/bulk-action-bar";
import type { CalendarDeadlineItem } from "@/types/calendar";
import { useCalendarSelection } from "./_hooks/use-calendar-selection";

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
	const {
		selectedIds,
		alertMessage,
		setAlertMessage,
		handleToggleSelect,
		handleClearSelection,
		handleBulkDelete,
		handleBulkComplete,
		handleBulkArchive,
		warningModal,
		confirmWarningAction,
		closeWarningModal,
	} = useCalendarSelection(items);

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
				onArchive={handleBulkArchive}
			/>

			<WarningModal
				isOpen={warningModal.isOpen}
				onClose={closeWarningModal}
				onConfirm={confirmWarningAction}
				variant={warningModal.actionType === "delete" ? "danger" : "warning"}
				title={
					warningModal.actionType === "delete"
						? "Delete items with unfinished work?"
						: warningModal.actionType === "archive"
							? "Archive projects with ongoing tasks?"
							: "Complete items with unfinished work?"
				}
				message="One or more selected items still have incomplete checklist items or ongoing tasks. Continuing will affect that unfinished work too."
				confirmText={
					warningModal.actionType === "delete"
						? "Delete"
						: warningModal.actionType === "archive"
							? "Archive"
							: "Complete"
				}
			/>
		</div>
	);
}
