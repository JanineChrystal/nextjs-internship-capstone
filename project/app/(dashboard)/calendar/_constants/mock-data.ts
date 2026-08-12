import type { CalendarEvent } from "@/app/(dashboard)/_components/ui/calendar/big-calendar";
import type { CalendarDeadlineItem } from "@/types/calendar";

export const globalEvents: CalendarEvent[] = [
	{
		id: "1",
		title: "Website Redesign",
		start: new Date(2026, 7, 15),
		end: new Date(2026, 7, 15),
		allDay: true,
		extendedProps: { type: "project", priority: "high" },
	},
	{
		id: "2",
		title: "Team Meeting",
		start: new Date(2026, 7, 18, 10, 0),
		end: new Date(2026, 7, 18, 11, 0),
		extendedProps: { type: "task", priority: "medium" },
	},
];

export const upcomingDeadlines: CalendarDeadlineItem[] = [
	{
		id: "1",
		title: "Website Redesign",
		dueDate: new Date(2026, 7, 15).toISOString(),
		type: "project",
		priority: "high",
	},
	{
		id: "2",
		title: "Team Meeting",
		date: new Date(2026, 7, 18, 10, 0).toISOString(),
		type: "task",
		priority: "medium",
		category: "General",
		columnId: "upcoming",
	},
];
