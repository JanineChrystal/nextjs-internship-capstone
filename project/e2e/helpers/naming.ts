/** unique name - the specs run against a real database, so a fixed name would collide on the second run; the E2E prefix makes the leftovers findable in one query. */
export function uniqueName(prefix: string): string {
	const stamp = new Date()
		.toISOString()
		.replace(/[-:.TZ]/g, "")
		.slice(0, 14);
	const salt = Math.random().toString(36).slice(2, 6);
	return `${prefix} ${stamp}-${salt}`;
}
