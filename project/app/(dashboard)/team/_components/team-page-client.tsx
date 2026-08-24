"use client";

import dynamic from "next/dynamic";
import { PageHeader } from "@/app/(dashboard)/_components/ui/headers/page-header";
import { BulkActionBar } from "@/app/(dashboard)/_components/ui/toolbar/bulk-action-bar";
import { TeamToolbar } from "@/app/(dashboard)/team/_components/team-toolbar";
import { BoardView } from "@/app/(dashboard)/team/_components/views/board-view";
import { GridView } from "@/app/(dashboard)/team/_components/views/grid-view";
import { PendingView } from "@/app/(dashboard)/team/_components/views/pending-view";
import { useRecordSkeletonCount } from "@/hooks/use-skeleton-count";
import type { WorkspaceMemberOutputDTO } from "@/lib/dtos/workspace-member-dto";
import { useDirectorySelection } from "../_hooks/use-directory-selection";
import { useWorkspaceDirectory } from "../_hooks/use-workspace-directory";

const WarningModal = dynamic(
	() =>
		import("@/app/(dashboard)/_components/ui/modals/warning-modal").then(
			(m) => m.WarningModal,
		),
	{ ssr: false },
);

interface TeamPageClientProps {
	initialMembers: WorkspaceMemberOutputDTO[];
}

export function TeamPageClient({ initialMembers }: TeamPageClientProps) {
	// row count tracking - records the actual member count to size the loading skeleton correctly next time.
	useRecordSkeletonCount("team-members", initialMembers.length);
	const {
		members,
		removal,
		pendingRefreshKey,
		requestRemoveMember,
		requestRemoveSelected,
		closeRemoval,
		confirmRemoval,
		handleInvitesSettled,
	} = useWorkspaceDirectory(initialMembers);

	const {
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
	} = useDirectorySelection(members);

	// removal scope tracking - distinguishes between individual and bulk actions to tailor the warning modal text.
	const removalCount = removal.userIds?.size ?? selectedIds.size;
	const isSingleRemoval = removal.userIds?.size === 1;
	const singleTargetName = isSingleRemoval
		? members.find((member) => removal.userIds?.has(member.id))?.name
		: undefined;

	const handleConfirmRemoval = async () => {
		const removed = await confirmRemoval(selectedIds);
		if (removed) clearSelection();
	};

	return (
		<div className="flex flex-col gap-6 w-full relative h-full">
			<PageHeader
				title="Team"
				description="Manage workspace members and their roles across all projects."
			/>

			{/* centralized error reporting - delegates error handling to global toasts rather than shifting layout with inline banners. */}

			<div className="flex-1 overflow-auto">
				<TeamToolbar
					activeView={activeView}
					onViewChange={setActiveView}
					onToggleSort={() => handleSort("name")}
					availableRoles={availableRoles}
					onInvitesSettled={handleInvitesSettled}
				/>

				{activeView === "Grid" && (
					<GridView
						users={sortedMembers}
						selectedIds={selectedIds}
						onToggleSelect={toggleSelect}
						onSelectAll={selectAll}
						onRemove={requestRemoveMember}
						sortConfig={sortConfig}
						onSort={handleSort}
					/>
				)}

				{activeView === "Board" && (
					<BoardView
						users={sortedMembers}
						selectedIds={selectedIds}
						onToggleSelect={toggleSelect}
						onRemove={requestRemoveMember}
					/>
				)}

				{/* pending list refresh - forces a remount on invite actions to ensure new invitations are immediately visible. */}
				{activeView === "Pending" && <PendingView key={pendingRefreshKey} />}
			</div>

			{/* conditional bulk actions - hides the bulk action bar on views that don't support multi-selection operations. */}
			{activeView !== "Pending" && (
				<BulkActionBar
					selectedCount={selectedIds.size}
					onClearSelection={clearSelection}
					onDelete={requestRemoveSelected}
					deleteLabel="Remove User(s)"
				/>
			)}

			<WarningModal
				isOpen={removal.isOpen}
				onClose={closeRemoval}
				onConfirm={handleConfirmRemoval}
				title={
					isSingleRemoval
						? "Remove member from your directory"
						: "Remove members from your directory"
				}
				message={
					isSingleRemoval
						? `${singleTargetName ?? "This member"} will no longer appear in your team directory or member pickers. Their existing project and team memberships are not affected, and you can add them back by inviting them again.`
						: `${removalCount} member(s) will no longer appear in your team directory or member pickers. Their existing project and team memberships are not affected, and you can add them back by inviting them again.`
				}
				confirmText="Remove"
				variant="danger"
			/>
		</div>
	);
}
