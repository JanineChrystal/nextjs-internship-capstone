"use client";

import { format, getDay, parse, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
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
 * The month/week/day header above the grid.
 *
 * Two rows on a phone - the period label, then navigation and the view switch -
 * and one row from `sm` up. The controls are not duplicated per breakpoint: they
 * sit in a single row that the flex direction relocates, so there is one of each
 * button in the DOM and nothing to keep in step.
 *
 * On a phone the view switch grows to fill the width left over by the two
 * navigation buttons, which turns three cramped links into three tap targets of
 * a usable size. It stops growing at `sm`, where it would otherwise stretch
 * absurdly across a desktop toolbar.
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
			{/* Truncated rather than wrapped: "September 2026" on a narrow phone
			    would otherwise push the controls below the fold. */}
			<h2 className="truncate text-lg font-bold text-foreground sm:text-2xl">
				{label}
			</h2>

			<div className="flex items-center gap-2 sm:gap-4">
				{/* Prev / Next Navigation */}
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

				{/* View Toggles (Month, Week, Day) */}
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
 * The Week/Day event body.
 *
 * Those views give an event a real block of space, so it shows the full detail
 * set rather than the single-line pill Month view uses - but only from `sm` up.
 * A phone's day column is about 45px wide: a category chip and a status chip
 * side by side in that space are two or three truncated characters each, which
 * is noise standing where the title should be. Below `sm` only the priority dot
 * and the title are drawn, which is what the mobile reference shows too.
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

	// Custom Month Date Header component with inline interaction
	const CustomMonthDateHeader = useCallback(
		({ date: headerDate, label }: { date: Date; label: string }) => {
			return (
				<div className="flex items-center justify-between w-full group px-0.5 sm:p-1">
					{/*
					 * Always visible on a phone, hover-revealed from `sm` up.
					 *
					 * A touch screen has no hover state, so an `opacity-0` control that
					 * only appears on `group-hover` is simply unreachable there - this
					 * is the same failure the notifications mark-as-read control had.
					 * Creation is the only thing this button does, so losing it on
					 * mobile would remove the feature rather than hide it.
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
					 * Tapping the date number filters the side panel to that day.
					 *
					 * This button existed but had no `onClick` at all - the filtering
					 * ran only through react-big-calendar's `onSelectSlot`, which fires
					 * from its drag-selection layer. On a touch screen that layer needs
					 * a long press (RBC's `longPressThreshold`, 250ms by default) before
					 * it reports anything, so an ordinary tap on a date did nothing and
					 * the feature looked broken on a phone.
					 *
					 * Wiring it here makes the date number a real control: it works on
					 * touch, on a mouse and from the keyboard, and it does not depend on
					 * a gesture layer behaving the same way on every device.
					 * `onSelectSlot` stays for the click-and-drag path on desktop.
					 */}
					<button
						type="button"
						onClick={(e) => {
							// Otherwise the cell underneath registers the click as well and
							// the day is selected, then immediately deselected.
							e.stopPropagation();
							onDateCellClick?.(headerDate);
						}}
						className="rounded px-1 text-xs font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
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
			month: {
				dateHeader: CustomMonthDateHeader,
			},
		}),
		[CustomMonthDateHeader, view],
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
					// The detailed renderer needs room to show its extra rows; short
					// events would otherwise clip them entirely. Lower on a phone,
					// where 58px of every event stacked in a day column pushes the
					// later ones off the bottom of the grid - the detailed renderer
					// there shows the title and drops to one meta row anyway.
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
	 * Date labels, shortened for a phone.
	 *
	 * Seven columns on a 360px screen leave roughly 50px each. "04 Wed" does not
	 * fit in that, and react-big-calendar lays the grid out as a table - so a
	 * header that will not fit does not wrap or truncate, it widens its column
	 * and pushes the whole grid past the edge of the card. A single letter plus
	 * the date is what the mobile design uses, and it is what fits.
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
				 * "ignoreEvents", not `true`.
				 *
				 * In Week and Day views react-big-calendar attaches its drag-selection
				 * listener to the whole day column - events included - and its own
				 * click and doubleClick handlers then consume the gesture and report a
				 * SLOT selection. The result was that double-clicking a task or project
				 * in those two views did nothing at all, while Month view worked fine:
				 * Month puts its selection layer BEHIND the events, so they keep their
				 * own clicks.
				 *
				 * "ignoreEvents" is the library's documented setting for exactly this -
				 * "useful when you want custom event click or drag logic". Slot
				 * selection still works on empty space; a gesture that starts on an
				 * event is left alone for the event's own handlers.
				 */
				selectable="ignoreEvents"
				onSelectSlot={(slotInfo) => onDateCellClick?.(slotInfo.start)}
				/*
				 * Side-by-side rather than stacked with offsets. The default overlaps
				 * concurrent events so each is partly hidden behind the next, which at
				 * a phone's ~45px day column left a row of unreadable fragments.
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
