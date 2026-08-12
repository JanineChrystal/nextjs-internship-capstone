"use client";

import dynamic from "next/dynamic";
import { PageHeader } from "@/app/(dashboard)/_components/ui/headers/page-header";
import { BulkActionBar } from "@/app/(dashboard)/_components/ui/toolbar/bulk-action-bar";
import { TeamToolbar } from "@/app/(dashboard)/team/_components/team-toolbar";
import { BoardView } from "@/app/(dashboard)/team/_components/views/board-view";
import { GridView } from "@/app/(dashboard)/team/_components/views/grid-view";
import { mockWorkspaceUsers } from "./_constants/mock-data";
import { useTeamPage } from "./_hooks/use-team-page";

const WarningModal = dynamic(
	() =>
		import("@/app/(dashboard)/_components/ui/modals/warning-modal").then(
			(m) => m.WarningModal,
		),
	{ ssr: false },
);

export default function TeamPage() {
	const {
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
	} = useTeamPage(mockWorkspaceUsers);

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
