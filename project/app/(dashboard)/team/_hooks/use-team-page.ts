import { useCallback, useMemo, useState } from "react";
import type { WorkspaceUser } from "@/types/member";
import type { TeamViewType } from "../_components/team-toolbar";

export function useTeamPage(initialUsers: WorkspaceUser[]) {
	const [users, setUsers] = useState<WorkspaceUser[]>(initialUsers);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
	const [userToRemove, setUserToRemove] = useState<string | null>(null);
	const [activeView, setActiveView] = useState<TeamViewType>("Grid");
	const [sortConfig, setSortConfig] = useState<{
		key: string;
		direction: "asc" | "desc";
	} | null>(null);

	const handleToggleSelect = useCallback((userId: string) => {
		setSelectedIds((prev) =>
			prev.includes(userId)
				? prev.filter((id) => id !== userId)
				: [...prev, userId],
		);
	}, []);

	const handleSelectAll = useCallback(
		(checked: boolean) => {
			if (checked) {
				setSelectedIds(users.map((u) => u.id));
			} else {
				setSelectedIds([]);
			}
		},
		[users],
	);

	const handleClearSelection = useCallback(() => {
		setSelectedIds([]);
	}, []);

	const handleRemoveSelected = useCallback(() => {
		setUserToRemove(null);
		setIsWarningModalOpen(true);
	}, []);

	const handleRemoveIndividual = useCallback((userId: string) => {
		setUserToRemove(userId);
		setIsWarningModalOpen(true);
	}, []);

	const confirmRemoval = useCallback(() => {
		if (userToRemove) {
			setUsers((prev) => prev.filter((u) => u.id !== userToRemove));
			setSelectedIds((prev) => prev.filter((id) => id !== userToRemove));
		} else {
			setUsers((prev) => prev.filter((u) => !selectedIds.includes(u.id)));
			setSelectedIds([]);
		}
		setIsWarningModalOpen(false);
		setUserToRemove(null);
	}, [userToRemove, selectedIds]);

	const handleSort = useCallback(
		(key: string) => {
			let direction: "asc" | "desc" = "asc";
			if (
				sortConfig &&
				sortConfig.key === key &&
				sortConfig.direction === "asc"
			) {
				direction = "desc";
			}
			setSortConfig({ key, direction });

			setUsers((prev) => {
				return [...prev].sort((a, b) => {
					const valA = a[key as keyof WorkspaceUser];
					const valB = b[key as keyof WorkspaceUser];

					if (typeof valA === "string" && typeof valB === "string") {
						return direction === "asc"
							? valA.localeCompare(valB)
							: valB.localeCompare(valA);
					}
					if (typeof valA === "number" && typeof valB === "number") {
						return direction === "asc" ? valA - valB : valB - valA;
					}
					return 0;
				});
			});
		},
		[sortConfig],
	);

	const availableRoles = useMemo(() => {
		return Array.from(new Set(users.flatMap((u) => u.roles))).sort();
	}, [users]);

	return {
		users,
		selectedIds,
		isWarningModalOpen,
		userToRemove,
		activeView,
		sortConfig,
		availableRoles,
		setActiveView,
		setIsWarningModalOpen,
		setUserToRemove,
		handleToggleSelect,
		handleSelectAll,
		handleClearSelection,
		handleRemoveSelected,
		handleRemoveIndividual,
		confirmRemoval,
		handleSort,
	};
}
