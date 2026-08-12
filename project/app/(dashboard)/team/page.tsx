"use client";

import { useState } from "react";
import { PageHeader } from "@/app/(dashboard)/_components/ui/headers/page-header";
import { WarningModal } from "@/app/(dashboard)/_components/ui/modals/warning-modal";
import { BulkActionBar } from "@/app/(dashboard)/_components/ui/toolbar/bulk-action-bar";
import {
	TeamToolbar,
	type TeamViewType,
} from "@/app/(dashboard)/team/_components/team-toolbar";
import { BoardView } from "@/app/(dashboard)/team/_components/views/board-view";
import { GridView } from "@/app/(dashboard)/team/_components/views/grid-view";
import type { WorkspaceUser } from "@/types/member";

// Mock Data
const mockWorkspaceUsers: WorkspaceUser[] = [
	{
		id: "u1",
		name: "Janine Chrystal",
		email: "janine@example.com",
		roles: ["Project Manager", "Developer"],
		projectIds: ["p1", "p2", "p3"],
		projectCount: 3,
		status: "active",
	},
	{
		id: "u2",
		name: "Alex Johnson",
		email: "alex@example.com",
		roles: ["Developer"],
		projectIds: ["p1"],
		projectCount: 1,
		status: "active",
	},
	{
		id: "u3",
		name: "Sam Smith",
		email: "sam@example.com",
		roles: ["Designer", "Project Manager"],
		projectIds: ["p2", "p4"],
		projectCount: 2,
		status: "active",
	},
];

export default function TeamPage() {
	const [users, setUsers] = useState<WorkspaceUser[]>(mockWorkspaceUsers);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
	const [userToRemove, setUserToRemove] = useState<string | null>(null);
	const [activeView, setActiveView] = useState<TeamViewType>("Grid");
	const [sortConfig, setSortConfig] = useState<{
		key: string;
		direction: "asc" | "desc";
	} | null>(null);

	// Selection Handlers
	const handleToggleSelect = (userId: string) => {
		setSelectedIds((prev) =>
			prev.includes(userId)
				? prev.filter((id) => id !== userId)
				: [...prev, userId],
		);
	};
	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			setSelectedIds(users.map((u) => u.id));
		} else {
			setSelectedIds([]);
		}
	};
	const handleClearSelection = () => {
		setSelectedIds([]);
	};

	// Removal Handlers
	const handleRemoveSelected = () => {
		// Just open warning modal for bulk removal
		setUserToRemove(null); // null means bulk
		setIsWarningModalOpen(true);
	};

	const handleRemoveIndividual = (userId: string) => {
		setUserToRemove(userId);
		setIsWarningModalOpen(true);
	};

	const confirmRemoval = () => {
		if (userToRemove) {
			// Remove single user
			setUsers(users.filter((u) => u.id !== userToRemove));
			setSelectedIds(selectedIds.filter((id) => id !== userToRemove));
		} else {
			// Remove bulk
			setUsers(users.filter((u) => !selectedIds.includes(u.id)));
			setSelectedIds([]);
		}
		setIsWarningModalOpen(false);
		setUserToRemove(null);
	};

	const handleSort = (key: string) => {
		let direction: "asc" | "desc" = "asc";
		if (
			sortConfig &&
			sortConfig.key === key &&
			sortConfig.direction === "asc"
		) {
			direction = "desc";
		}
		setSortConfig({ key, direction });

		const sorted = [...users].sort((a, b) => {
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
		setUsers(sorted);
	};

	const availableRoles = Array.from(
		new Set(users.flatMap((u) => u.roles)),
	).sort();

	return (
		<div className="flex flex-col gap-6 w-full relative h-full">
			<PageHeader
				title="Team"
				description="Manage workspace members and their roles across all projects."
			/>

			<div className="flex-1 overflow-auto">
				<TeamToolbar
					activeView={activeView}
					onViewChange={setActiveView}
					onToggleSort={() => handleSort("name")}
					availableRoles={availableRoles}
				/>

				{activeView === "Grid" ? (
					<GridView
						users={users}
						selectedIds={selectedIds}
						onToggleSelect={handleToggleSelect}
						onSelectAll={handleSelectAll}
						onRemove={handleRemoveIndividual}
						sortConfig={sortConfig}
						onSort={handleSort}
					/>
				) : (
					<BoardView
						users={users}
						selectedIds={selectedIds}
						onToggleSelect={handleToggleSelect}
						onRemove={handleRemoveIndividual}
					/>
				)}
			</div>

			<BulkActionBar
				selectedCount={selectedIds.length}
				onClearSelection={handleClearSelection}
				onDelete={handleRemoveSelected}
				deleteLabel="Remove User(s)"
			/>

			<WarningModal
				isOpen={isWarningModalOpen}
				onClose={() => {
					setIsWarningModalOpen(false);
					setUserToRemove(null);
				}}
				onConfirm={confirmRemoval}
				title={
					userToRemove
						? "Remove User from Workspace"
						: "Remove Users from Workspace"
				}
				message={
					userToRemove
						? "Are you sure you want to remove this user from the workspace? They will lose access to all projects they are assigned to. This action cannot be undone."
						: `Are you sure you want to remove ${selectedIds.length} users from the workspace? They will lose access to all projects they are assigned to. This action cannot be undone.`
				}
				confirmText="Remove User(s)"
				variant="danger"
			/>
		</div>
	);
}
