"use client";

import { DeadlineCard } from "@/app/(dashboard)/_components/ui/cards/deadline-card";
import { BulkActionBar } from "@/app/(dashboard)/_components/ui/toolbar/bulk-action-bar";
import { ConfirmDialog } from "@/components/ui/feedback/confirm-dialog";
import { useRecordSkeletonCount } from "@/hooks/use-skeleton-count";
import type { CalendarDeadlineItem } from "@/types/calendar";
import { useCalendarSelection } from "./_hooks/use-calendar-selection";

interface CalendarSidePanelProps {
	title?: string;
	items: CalendarDeadlineItem[];
	onItemClick?: (item: CalendarDeadlineItem) => void;
	onItemDoubleClick?: (item: CalendarDeadlineItem) => void;
}

/**
 * calendar side panel component - renders a deadline list with bulk selection capabilities for both global and project-specific calendars.
 * bulk action rules and state are centralized in useCalendarSelection to ensure consistency across views.
 */
export function CalendarSidePanel({
	title = "Upcoming Deadlines",
	items,
	onItemClick,
	onItemDoubleClick,
}: CalendarSidePanelProps) {
	const {
		selectedIds,
		handleToggleSelect,
		handleClearSelection,
		handleBulkDelete,
		handleBulkComplete,
		confirmState,
		confirmCopy,
		confirmAction,
		closeConfirm,
	} = useCalendarSelection(items);

	// loading skeleton count - records the current item count to correctly size the skeleton loader during transitions.
	useRecordSkeletonCount("calendar-deadlines", items.length);

	return (
		<div className="xl:col-span-1 bg-surface rounded-xl border border-outline-variant p-4 sm:p-6 h-100 sm:h-125 xl:h-187.5 relative flex flex-col">
			<div className="flex items-center justify-between mb-6">
				<h3 className="text-lg font-bold text-foreground">{title}</h3>
			</div>

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

			{/* restricted bulk actions - omits the archive action since projects cannot be modified via bulk actions from this calendar view. */}
			<BulkActionBar
				selectedCount={selectedIds.size}
				onClearSelection={handleClearSelection}
				onDelete={handleBulkDelete}
				onComplete={handleBulkComplete}
			/>

			{/* centralized confirmation dialog - relies on useCalendarSelection to provide context-aware text based on action types and item states. */}
			<ConfirmDialog
				isOpen={confirmState.isOpen}
				onClose={closeConfirm}
				onConfirm={confirmAction}
				title={confirmCopy.title}
				description={confirmCopy.description}
				confirmLabel={confirmCopy.confirmLabel}
				tone={confirmCopy.tone}
			/>
		</div>
	);
}
