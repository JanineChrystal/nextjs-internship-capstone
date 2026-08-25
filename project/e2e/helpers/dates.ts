/** datetime-local value - the exact shape a native <input type="datetime-local"> reads and emits, in local time. */
function toDatetimeLocal(date: Date): string {
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** relative day - offset from today at a fixed hour, so a run is never sensitive to the time it starts. */
export function dayOffset(days: number, hour = 9): string {
	const date = new Date();
	date.setDate(date.getDate() + days);
	date.setHours(hour, 0, 0, 0);
	return toDatetimeLocal(date);
}

export const TODAY_DAY_OF_MONTH = new Date().getDate();
