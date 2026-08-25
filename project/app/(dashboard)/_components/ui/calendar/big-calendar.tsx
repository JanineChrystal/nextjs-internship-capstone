"use client";

import { format, getDay, parse, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
	Children,
	cloneElement,
	type ReactElement,
	useCallback,
	useMemo,
	useState,
} from "react";
import type { ToolbarProps, View } from "react-big-calendar";
import { Calendar, dateFnsLocalizer, Navigate } from "react-big-calendar";
import {
	CALENDAR_LOCALES,
	PRIORITY_DOT_CLASSES,
} from "@/app/(dashboard)/_constants/calendar";
import { Button } from "@/components/ui/buttons/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useHasCoarsePointer } from "@/hooks/use-coarse-pointer";
import { useIsMobile } from "@/hooks/use-mobile";
import type { CalendarEvent } from "@/lib/types/calendar";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "./calendar-overrides.css";

const localizer = dateFnsLocalizer({
	format,
	parse,
	startOfWeek,
	getDay,
	locales: CALENDAR_LOCALES,
});

interface GenericCalendarProps {
	events: CalendarEvent[];
	defaultView?: View;
	onEventSingleClick?: (event: CalendarEvent) => void;
	onEventDoubleClick?: (event: CalendarEvent) => void;
	// Fired only by the dedicated "+" icon - triggers creation.
	onDateClick?: (date: Date) => void;
	// Fired when the date cell's background (not the "+" icon, not an event)
	// is clicked - used to filter/highlight, not to create anything.
	onDateCellClick?: (date: Date) => void;
	selectedEventId?: string | null;
	selectedDate?: Date | null;
	className?: string;
}

/**
 * custom toolbar component - renders the calendar navigation header, using responsive
 * flex layouts to stack controls on mobile while keeping a single DOM structure.
 */
function CustomToolbar({
	label,
	onNavigate,
	onView,
	views,
	view,
}: ToolbarProps<CalendarEvent>) {
	return (
		<div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
			{/* responsive title - truncates long date labels to prevent pushing navigation controls off-screen on small devices. */}
			<h2 className="truncate text-lg font-bold text-foreground sm:text-2xl">
				{label}
			</h2>

			<div className="flex items-center gap-2 sm:gap-4">
				{/* navigation controls */}
				<div className="flex shrink-0 gap-2">
					<Button
						variant="outline"
						size="icon"
						onClick={() => onNavigate(Navigate.PREVIOUS)}
						aria-label="Previous period"
						className="size-9 bg-surface border-outline-variant hover:bg-surface-variant"
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						onClick={() => onNavigate(Navigate.NEXT)}
						aria-label="Next period"
						className="size-9 bg-surface border-outline-variant hover:bg-surface-variant"
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>

				{/* view toggles */}
				<div className="flex flex-1 rounded-lg bg-surface-container p-1 sm:flex-none">
					{(views as View[]).map((viewName) => (
						<button
							key={viewName}
							type="button"
							onClick={() => onView(viewName)}
							aria-pressed={view === viewName}
							className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium capitalize transition-colors sm:flex-none sm:px-4 sm:text-sm ${
								view === viewName
									? "bg-primary text-primary-foreground shadow-sm"
									: "text-secondary hover:text-foreground"
							}`}
						>
							{viewName}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}

function CustomEvent({ event }: { event: CalendarEvent }) {
	return (
		<TooltipProvider delayDuration={300}>
			<Tooltip>
				<TooltipTrigger asChild>
					<div className="flex items-center justify-start gap-1.5 text-[10px] sm:text-xs px-1 overflow-hidden whitespace-nowrap w-full h-full cursor-pointer group">
						<div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 group-hover:scale-125 transition-transform" />
						<span className="text-foreground truncate">{event.title}</span>
					</div>
				</TooltipTrigger>
				<TooltipContent
					className="flex flex-col gap-1 p-3 min-w-50 bg-surface text-on-surface border border-outline-variant shadow-md [&_svg]:fill-surface"
					side="top"
				>
					<div className="font-semibold text-sm mb-1">{event.title}</div>
					<div className="flex items-center justify-between text-xs text-secondary">
						<span>Start:</span>
						<span className="text-on-surface">
							{format(event.start, "MMM d, yyyy")}
						</span>
					</div>
					<div className="flex items-center justify-between text-xs text-secondary">
						<span>Due:</span>
						<span className="text-on-surface">
							{format(event.end, "MMM d, yyyy")}
						</span>
					</div>
					{event.extendedProps?.priority && (
						<div className="flex items-center justify-between text-xs text-secondary mt-1">
							<span>Priority:</span>
							<span className="text-on-surface capitalize">
								{event.extendedProps.priority}
							</span>
						</div>
					)}
					{event.extendedProps?.type && (
						<div className="flex items-center justify-between text-xs text-secondary mt-1">
							<span>Type:</span>
							<span className="text-on-surface capitalize">
								{event.extendedProps.type}
							</span>
						</div>
					)}
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

/**
 * custom detailed event component - renders full event metadata for Week/Day views
 * on desktop, falling back to a compact title-only display on mobile to fit narrow columns.
 */
function CustomDetailedEvent({ event }: { event: CalendarEvent }) {
	const { priority, type, category, status } = event.extendedProps ?? {};

	return (
		<div className="flex flex-col gap-0.5 h-full w-full overflow-hidden px-1 py-0.5 text-left sm:px-1.5 sm:py-1">
			<div className="flex items-center gap-1 min-w-0 sm:gap-1.5">
				<span
					className={`w-1.5 h-1.5 rounded-full shrink-0 ${
						PRIORITY_DOT_CLASSES[priority ?? ""] ?? "bg-primary"
					}`}
				/>
				<span className="text-[10px] font-semibold text-foreground truncate sm:text-[11px]">
					{event.title}
				</span>
			</div>

			<div className="hidden flex-wrap items-center gap-1 min-w-0 sm:flex">
				{category && (
					<span className="px-1 py-px rounded bg-primary/10 text-primary text-[9px] font-medium uppercase tracking-wide truncate max-w-full">
						{category}
					</span>
				)}
				{status && (
					<span className="px-1 py-px rounded bg-surface-variant text-secondary text-[9px] font-medium truncate max-w-full">
						{status}
					</span>
				)}
			</div>

			{priority && (
				<span className="hidden text-[9px] text-secondary capitalize truncate sm:inline">
					{priority} priority{type ? ` · ${type}` : ""}
				</span>
			)}
		</div>
	);
}

export function BigCalendar({
	events,
	defaultView = "month",
	onEventSingleClick,
	onEventDoubleClick,
	onDateClick,
	onDateCellClick,
	selectedEventId,
	selectedDate,
	className,
}: GenericCalendarProps) {
	const [view, setView] = useState<View>(defaultView);
	const [date, setDate] = useState<Date>(new Date());
	const isMobile = useIsMobile();
	const isCoarsePointer = useHasCoarsePointer();

	/**
	 * touch date filtering - makes the whole day cell tappable on a touch device.
	 *
	 * On a mouse, clicking a day's background fires `onSelectSlot` and filters the
	 * side panel. On touch, react-big-calendar routes slot selection through a
	 * 250ms long press, so an ordinary tap did nothing at all - and the date
	 * number, the only wired control, is a ~20px target inside a small cell.
	 *
	 * `dateCellWrapper` wraps `.rbc-day-bg`, the full-size background of one day,
	 * so this hands touch a target the size of the cell. It is attached only for a
	 * coarse pointer: with a mouse this would fire alongside `onSelectSlot` and
	 * toggle the filter twice, applying and clearing it in one click.
	 */
	const CustomDateCellWrapper = useCallback(
		({ children, value }: { children: React.ReactNode; value: Date }) => {
			const cell = Children.only(children) as ReactElement<{
				onClick?: () => void;
			}>;

			if (!isCoarsePointer) return cell;

			return cloneElement(cell, {
				onClick: () => onDateCellClick?.(value),
			});
		},
		[isCoarsePointer, onDateCellClick],
	);

	// custom month date header - provides interactive date cells for the month grid.
	const CustomMonthDateHeader = useCallback(
		({ date: headerDate, label }: { date: Date; label: string }) => {
			return (
				<div className="flex items-center justify-between w-full group px-0.5 sm:p-1">
					{/*
					 * touch-aware add button - keeps the creation icon permanently visible on mobile where hover states don't exist.
					 */}
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onDateClick?.(headerDate);
						}}
						className="rounded p-0.5 text-secondary opacity-60 transition-all hover:bg-surface-variant hover:text-primary focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
						aria-label={`Create on ${label}`}
						title="Create on this date"
					>
						<Plus className="w-3 h-3" />
					</button>
					{/*
					 * interactive date label - wires direct click handlers to the date number to bypass unreliable touch-gesture layers for side panel filtering.
					 */}
					<button
						type="button"
						onClick={(e) => {
							// propagation stop - prevents the underlying slot from triggering a duplicate selection event.
							e.stopPropagation();
							onDateCellClick?.(headerDate);
						}}
						// min-w-6 - the number was a ~20px target inside an already small cell, which is under any reasonable minimum for a finger. The cell background is now tappable too (see CustomDateCellWrapper); this just stops the number itself being the hard part.
						className="min-w-6 rounded px-1 py-0.5 text-xs font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
					>
						{label}
					</button>
				</div>
			);
		},
		[onDateClick, onDateCellClick],
	);

	const views = useMemo(() => ["month", "week", "day"], []);

	const components = useMemo(
		() => ({
			toolbar: CustomToolbar,
			event: view === "month" ? CustomEvent : CustomDetailedEvent,
			dateCellWrapper: CustomDateCellWrapper,
			month: {
				dateHeader: CustomMonthDateHeader,
			},
		}),
		[CustomMonthDateHeader, CustomDateCellWrapper, view],
	);

	const eventPropGetter = useCallback(
		(event: CalendarEvent) => {
			const isSelected = selectedEventId && event.id === selectedEventId;
			return {
				className: `transition-all duration-200 border-l-2 ${
					isSelected
						? "bg-primary/10 border-primary shadow-sm"
						: "bg-surface border-transparent hover:bg-surface-variant"
				}`,
				style: {
					borderRadius: "4px",
					outline: "none",
					// minimum height sizing - ensures detailed events have enough vertical space for their content, scaling down on mobile to prevent grid overflow.
					...(view === "month"
						? {}
						: { minHeight: isMobile ? "38px" : "58px" }),
				},
			};
		},
		[selectedEventId, view, isMobile],
	);

	const dayPropGetter = useCallback(
		(day: Date) => {
			if (selectedDate && day.toDateString() === selectedDate.toDateString()) {
				return { className: "rbc-day-selected" };
			}
			return {};
		},
		[selectedDate],
	);

	/**
	 * responsive date formats - abbreviates day labels on mobile devices to prevent
	 * table column expansion from breaking the grid layout.
	 */
	const formats = useMemo(
		() =>
			isMobile
				? { dayFormat: "EEEEE d", weekdayFormat: "EEEEE" }
				: { dayFormat: "dd EEE" },
		[isMobile],
	);

	return (
		<div className={`h-full w-full ${className}`}>
			<Calendar
				localizer={localizer}
				events={events}
				startAccessor="start"
				endAccessor="end"
				view={view}
				onView={setView}
				date={date}
				onNavigate={setDate}
				views={views as View[]}
				onSelectEvent={onEventSingleClick}
				onDoubleClickEvent={onEventDoubleClick}
				/*
				 * selective slot interaction - ignores drag-selection over events so they can handle their own click events without interference from the background grid.
				 */
				selectable="ignoreEvents"
				onSelectSlot={(slotInfo) => onDateCellClick?.(slotInfo.start)}
				/*
				 * flat layout algorithm - renders concurrent events side-by-side rather than overlapping them, which is critical for legibility in narrow mobile columns.
				 */
				dayLayoutAlgorithm="no-overlap"
				components={components}
				eventPropGetter={eventPropGetter}
				dayPropGetter={dayPropGetter}
				formats={formats}
			/>
		</div>
	);
}
