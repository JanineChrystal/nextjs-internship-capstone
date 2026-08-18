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

function CustomToolbar({
	label,
	onNavigate,
	onView,
	views,
	view,
}: ToolbarProps<CalendarEvent>) {
	return (
		<div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
			<h2 className="text-2xl font-bold text-foreground">{label}</h2>

			<div className="flex items-center gap-4">
				{/* Prev / Next Navigation */}
				<div className="flex space-x-2">
					<Button
						variant="outline"
						size="icon"
						onClick={() => onNavigate(Navigate.PREVIOUS)}
						className="bg-surface border-outline-variant hover:bg-surface-variant"
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						onClick={() => onNavigate(Navigate.NEXT)}
						className="bg-surface border-outline-variant hover:bg-surface-variant"
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>

				{/* View Toggles (Month, Week, Day) */}
				<div className="flex bg-surface-container rounded-lg p-1">
					{(views as View[]).map((viewName) => (
						<button
							key={viewName}
							type="button"
							onClick={() => onView(viewName)}
							className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${
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

// Week/Day views give each event a real block of space, so show the full
// detail set there instead of the single-line pill used in Month view.
function CustomDetailedEvent({ event }: { event: CalendarEvent }) {
	const { priority, type, category, status } = event.extendedProps ?? {};

	return (
		<div className="flex flex-col gap-0.5 h-full w-full overflow-hidden px-1.5 py-1 text-left">
			<div className="flex items-center gap-1.5 min-w-0">
				<span
					className={`w-1.5 h-1.5 rounded-full shrink-0 ${
						PRIORITY_DOT_CLASSES[priority ?? ""] ?? "bg-primary"
					}`}
				/>
				<span className="text-[11px] font-semibold text-foreground truncate">
					{event.title}
				</span>
			</div>

			<div className="flex flex-wrap items-center gap-1 min-w-0">
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
				<span className="text-[9px] text-secondary capitalize truncate">
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

	// Custom Month Date Header component with inline interaction
	const CustomMonthDateHeader = useCallback(
		({ date: headerDate, label }: { date: Date; label: string }) => {
			return (
				<div className="flex items-center justify-end w-full group p-1">
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onDateClick?.(headerDate);
						}}
						className="mr-auto opacity-0 group-hover:opacity-100 p-0.5 hover:bg-surface-variant rounded transition-all text-secondary hover:text-primary"
						title="Create on this date"
					>
						<Plus className="w-3 h-3" />
					</button>
					<button
						type="button"
						className="text-sm font-medium hover:underline focus:outline-none"
					>
						{label}
					</button>
				</div>
			);
		},
		[onDateClick],
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
					// The detailed renderer needs room to show its extra rows;
					// short events would otherwise clip them entirely.
					...(view === "month" ? {} : { minHeight: "58px" }),
				},
			};
		},
		[selectedEventId, view],
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
				selectable={true}
				onSelectSlot={(slotInfo) => onDateCellClick?.(slotInfo.start)}
				components={components}
				eventPropGetter={eventPropGetter}
				dayPropGetter={dayPropGetter}
				formats={{
					dayFormat: "dd EEE",
				}}
			/>
		</div>
	);
}
