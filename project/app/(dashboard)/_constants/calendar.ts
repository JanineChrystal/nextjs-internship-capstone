import { enUS } from "date-fns/locale";

/**
 * Locale table for the date-fns localizer. Only en-US is registered; adding a
 * language means adding an entry here rather than editing the calendar itself.
 */
export const CALENDAR_LOCALES = {
	"en-US": enUS,
};

/**
 * Dot colour per priority on a calendar event.
 *
 * Deliberately a lookup rather than a conditional chain, so an unrecognised
 * priority renders no dot instead of falling through to whichever branch
 * happened to be last.
 */
export const PRIORITY_DOT_CLASSES: Record<string, string> = {
	low: "bg-emerald-500",
	medium: "bg-amber-500",
	high: "bg-orange-500",
	urgent: "bg-red-500",
};
