/** roster comparison - set questions about two lists of user ids, shared by the groups DAL and the settings UI so a button and the action behind it cannot disagree. */

/** same roster - the two lists hold exactly the same people, ignoring order and duplicates. */
export function isSameRoster(a: string[], b: string[]): boolean {
	const left = new Set(a);
	const right = new Set(b);
	if (left.size !== right.size) return false;

	for (const id of left) {
		if (!right.has(id)) return false;
	}
	return true;
}

/** fully contained - every id in `subset` is present in `superset`; an empty subset is false, so an empty group still shows its controls. */
export function isRosterContainedIn(
	subset: string[],
	superset: Iterable<string>,
): boolean {
	if (subset.length === 0) return false;

	const outer = new Set(superset);
	return subset.every((id) => outer.has(id));
}
