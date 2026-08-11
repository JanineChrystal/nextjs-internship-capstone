"use client";

import { format, getDay, parse, startOfWeek } from "date-fns";
import { enUS } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type { ToolbarProps, View } from "react-big-calendar";
import { Calendar, dateFnsLocalizer, Navigate } from "react-big-calendar";
import { Button } from "@/components/ui/buttons/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "./calendar-overrides.css";

const locales = {
	"en-US": enUS,
};

const localizer = dateFnsLocalizer({
	format,
	parse,
	startOfWeek,
	getDay,
	locales,
});

export interface CalendarEvent {
	id: string;
	title: string;
	start: Date;
	end: Date;
	allDay?: boolean;
	resource?: unknown;
	extendedProps?: {
		priority?: string;
		type?: "project" | "task";
		[key: string]: unknown;
	};
}

interface GenericCalendarProps {
	events: CalendarEvent[];
	defaultView?: View;
	onEventSingleClick?: (event: CalendarEvent) => void;
	onEventDoubleClick?: (event: CalendarEvent) => void;
	onDateClick?: (date: Date) => void;
	selectedEventId?: string | null;
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
				<TooltipContent className="flex flex-col gap-1 p-3 min-w-50" side="top">
					<div className="font-semibold text-sm mb-1">{event.title}</div>
					<div className="flex items-center justify-between text-xs text-muted-foreground">
						<span>Start:</span>
						<span className="text-foreground">
							{format(event.start, "MMM d, yyyy")}
						</span>
					</div>
					<div className="flex items-center justify-between text-xs text-muted-foreground">
						<span>Due:</span>
						<span className="text-foreground">
							{format(event.end, "MMM d, yyyy")}
						</span>
					</div>
					{event.extendedProps?.priority && (
						<div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
							<span>Priority:</span>
							<span className="text-foreground capitalize">
								{event.extendedProps.priority}
							</span>
						</div>
					)}
					{event.extendedProps?.type && (
						<div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
							<span>Type:</span>
							<span className="text-foreground capitalize">
								{event.extendedProps.type}
							</span>
						</div>
					)}
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

export function BigCalendar({
	events,
	defaultView = "month",
	onEventSingleClick,
	onEventDoubleClick,
	onDateClick,
	selectedEventId,
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
						onClick={() => onDateClick?.(headerDate)}
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
			event: CustomEvent,
			month: {
				dateHeader: CustomMonthDateHeader,
			},
		}),
		[CustomMonthDateHeader],
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
				},
			};
		},
		[selectedEventId],
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
				onSelectSlot={(slotInfo) => onDateClick?.(slotInfo.start)}
				components={components}
				eventPropGetter={eventPropGetter}
				formats={{
					dayFormat: "dd EEE",
				}}
			/>
		</div>
	);
}
