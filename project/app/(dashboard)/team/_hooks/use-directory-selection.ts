import { useCallback, useMemo, useState } from "react";
import type { WorkspaceMemberOutputDTO } from "@/lib/dtos/workspace-member-dto";
import type { TeamViewType } from "@/lib/types/team";

type SortConfig = { key: string; direction: "asc" | "desc" } | null;

/**
 * use-directory-selection hook - manages directory state including active view,
 * sorting config, and user selections, storing selected IDs as a Set for O(1)
 * lookups and seamless bulk action processing.
 */
export function useDirectorySelection(members: WorkspaceMemberOutputDTO[]) {
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [activeView, setActiveView] = useState<TeamViewType>("Grid");
	const [sortConfig, setSortConfig] = useState<SortConfig>(null);

	const toggleSelect = useCallback((userId: string) => {
		setSelectedIds((previous) => {
			const next = new Set(previous);
			if (next.has(userId)) {
				next.delete(userId);
			} else {
				next.add(userId);
			}
			return next;
		});
	}, []);

	const selectAll = useCallback(
		(checked: boolean) => {
			setSelectedIds(
				checked ? new Set(members.map((member) => member.id)) : new Set(),
			);
		},
		[members],
	);

	const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

	const handleSort = useCallback((key: string) => {
		setSortConfig((previous) => ({
			key,
			direction:
				previous?.key === key && previous.direction === "asc" ? "desc" : "asc",
		}));
	}, []);

	// sorted members derivation - calculates sorted state on the fly to avoid mutating the source list or drifting from the primary store.
	const sortedMembers = useMemo(() => {
		if (!sortConfig) return members;

		const { key, direction } = sortConfig;
		return [...members].sort((a, b) => {
			const valueA = a[key as keyof WorkspaceMemberOutputDTO];
			const valueB = b[key as keyof WorkspaceMemberOutputDTO];

			if (typeof valueA === "string" && typeof valueB === "string") {
				return direction === "asc"
					? valueA.localeCompare(valueB)
					: valueB.localeCompare(valueA);
			}
			if (typeof valueA === "number" && typeof valueB === "number") {
				return direction === "asc" ? valueA - valueB : valueB - valueA;
			}
			return 0;
		});
	}, [members, sortConfig]);

	const availableRoles = useMemo(
		() =>
			Array.from(new Set(members.flatMap((member) => member.jobRoles))).sort(),
		[members],
	);

	return {
		selectedIds,
		activeView,
		sortConfig,
		sortedMembers,
		availableRoles,
		setActiveView,
		toggleSelect,
		selectAll,
		clearSelection,
		handleSort,
	};
}
