/**
 * roster comparison - set questions about two lists of user ids.
 *
 * These live here rather than inside the groups DAL because the same two
 * questions are asked on both sides of the wire: the server refuses to save a
 * group whose roster already exists, and the settings UI decides from the same
 * comparison whether to offer "Add to project" and "Sync members". Two copies of
 * this drifting apart would show a button that the action then refuses.
 *
 * Every function treats its inputs as sets, so order and duplicates never change
 * the answer - which matters because one side comes from a SQL aggregate and the
 * other from a store.
 */

/** same roster - the two lists contain exactly the same people. */
export function isSameRoster(a: string[], b: string[]): boolean {
	const left = new Set(a);
	const right = new Set(b);
	if (left.size !== right.size) return false;

	for (const id of left) {
		if (!right.has(id)) return false;
	}
	return true;
}

/**
 * fully contained - every id in `subset` is present in `superset`.
 *
 * An empty subset is deliberately **not** treated as contained. A group with no
 * members has nothing to add, but answering "yes, it is all applied" would hide
 * the control on an empty group and leave no way to see that it is empty.
 */
export function isRosterContainedIn(
	subset: string[],
	superset: Iterable<string>,
): boolean {
	if (subset.length === 0) return false;

	const outer = new Set(superset);
	return subset.every((id) => outer.has(id));
}
