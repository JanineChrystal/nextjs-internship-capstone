"use client";

import dynamic from "next/dynamic";
import type React from "react";
import { Toolbar } from "@/app/(dashboard)/_components/ui/toolbar";
import { useToolbar } from "@/app/(dashboard)/_hooks/use-toolbar";
import { FILTERABLE_VIEWS } from "@/app/(dashboard)/projects/_constants/project";
import type { ProjectViewType } from "@/lib/types/project";
import { ProjectMembersGroup } from "./project-members-group";
import { ProjectViewTabs } from "./project-view-tabs";

const AddMemberModal = dynamic(
	() =>
		import("@/app/(dashboard)/_components/ui/modals/add-member-modal").then(
			(m) => m.AddMemberModal,
		),
	{ ssr: false },
);

export interface ProjectToolbarProps {
	projectId: string;
	activeView: ProjectViewType;
	onViewChange: (view: ProjectViewType) => void;
	renderFilter?: React.ReactNode;
	canOpenSettings?: boolean;
	/** invite permission - gates the add-member control and the modal behind it; the avatar row stays visible either way. */
	canManageMembers?: boolean;
}

export function ProjectToolbar({
	projectId,
	activeView,
	onViewChange,
	renderFilter,
	canOpenSettings = true,
	canManageMembers = false,
}: ProjectToolbarProps) {
	const {
		isAddMemberModalOpen,
		setIsAddMemberModalOpen,
		visibleMembers,
		remainingCount,
	} = useToolbar(projectId);

	const isFilterable = FILTERABLE_VIEWS.includes(activeView);

	return (
		<>
			<Toolbar
				leftSection={
					<ProjectViewTabs
						activeView={activeView}
						onViewChange={onViewChange}
						canOpenSettings={canOpenSettings}
					/>
				}
				rightSection={
					<>
						{isFilterable && renderFilter}
						<ProjectMembersGroup
							visibleMembers={visibleMembers}
							remainingCount={remainingCount}
							onAddMember={
								canManageMembers
									? () => setIsAddMemberModalOpen(true)
									: undefined
							}
						/>
					</>
				}
			/>

			{/* gated mount - the modal is not rendered at all without the permission, so its dynamic chunk is never requested by a member. */}
			{canManageMembers && (
				<AddMemberModal
					open={isAddMemberModalOpen}
					onOpenChange={setIsAddMemberModalOpen}
					scope="project"
					targetId={projectId}
				/>
			)}
		</>
	);
}
