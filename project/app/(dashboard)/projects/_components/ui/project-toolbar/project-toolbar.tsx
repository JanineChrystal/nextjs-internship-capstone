"use client";

import dynamic from "next/dynamic";
import type React from "react";
import { Toolbar } from "@/app/(dashboard)/_components/ui/toolbar";
import { useToolbar } from "@/app/(dashboard)/_hooks/use-toolbar";
import type { ProjectViewType } from "@/app/(dashboard)/projects/_constants/project";
import { FILTERABLE_VIEWS } from "@/app/(dashboard)/projects/_constants/project";
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
}

export function ProjectToolbar({
	projectId,
	activeView,
	onViewChange,
	renderFilter,
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
					/>
				}
				rightSection={
					<>
						{isFilterable && renderFilter}
						<ProjectMembersGroup
							visibleMembers={visibleMembers}
							remainingCount={remainingCount}
							onAddMember={() => setIsAddMemberModalOpen(true)}
						/>
					</>
				}
			/>

			<AddMemberModal
				open={isAddMemberModalOpen}
				onOpenChange={setIsAddMemberModalOpen}
				scope="project"
				targetId={projectId}
			/>
		</>
	);
}
