"use client";

import { format, getDay, parse, startOfWeek } from "date-fns";
import { enUS } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { ToolbarProps, View } from "react-big-calendar";
import { Calendar, dateFnsLocalizer, Navigate } from "react-big-calendar";
import { Button } from "@/components/ui/buttons/button";

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
}

interface GenericCalendarProps {
	events: CalendarEvent[];
	defaultView?: View;
	onSelectEvent?: (event: CalendarEvent) => void;
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
		<div className="flex items-center gap-1.5 text-[10px] sm:text-xs px-1 overflow-hidden text-ellipsis whitespace-nowrap">
			<div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
			<span className="text-foreground">{event.title}</span>
		</div>
	);
}

export function BigCalendar({
	events,
	defaultView = "month",
	onSelectEvent,
	className,
}: GenericCalendarProps) {
	const views = useMemo(() => ["month", "week", "day"], []);

	const components = useMemo(
		() => ({
			toolbar: CustomToolbar,
			event: CustomEvent,
		}),
		[],
	);

	const [view, setView] = useState<View>(defaultView);
	const [date, setDate] = useState<Date>(new Date());

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
				onSelectEvent={onSelectEvent}
				components={components}
				formats={{
					dayFormat: "dd EEE",
				}}
			/>
		</div>
	);
}
