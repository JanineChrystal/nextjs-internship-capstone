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
 * The deadline list beside a calendar, with bulk selection.
 *
 * Rendered by both the global calendar (projects and tasks) and a project's own
 * calendar view (tasks only). Every rule about what may be bulk-acted on lives
 * in `useCalendarSelection`, so the two surfaces cannot drift apart - including
 * the rule that no bulk action here may touch a project.
 *
 * There used to be an inline red banner here for refusals, driven by an
 * `alertMessage` that nothing had set since the guard behind it was removed -
 * dead state rendering an alert that could never appear. Refusals are toasts
 * now, matching every other page.
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

	// Feeds the side-panel skeleton in /calendar/loading.tsx.
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

			{/* No onArchive. Only a project can be archived and no bulk action here
			    may touch one, so the button could never succeed - see
			    useCalendarSelection. Archiving is on the projects list and in a
			    project's own settings. */}
			<BulkActionBar
				selectedCount={selectedIds.size}
				onClearSelection={handleClearSelection}
				onDelete={handleBulkDelete}
				onComplete={handleBulkComplete}
			/>

			{/* Wording comes from the hook rather than from ternaries here: it is the
			    only place that knows the count, the action and whether anything is
			    unfinished. */}
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
