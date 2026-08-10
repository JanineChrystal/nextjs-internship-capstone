"use client";

import { FILTERABLE_VIEWS } from "@/app/(dashboard)/projects/_constants/project";
import { AddMemberModal } from "@/app/(dashboard)/_components/ui/modals/add-member-modal";
import type { ProjectViewType } from "@/app/(dashboard)/projects/[id]/page";
import { useProjectToolbar } from "../../../_hooks/use-project-toolbar";
import { ProjectMembersGroup } from "./project-members-group";
import { ProjectViewTabs } from "./project-view-tabs";

interface ProjectToolbarProps {
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
	} = useProjectToolbar(projectId);

	const isFilterable = FILTERABLE_VIEWS.includes(activeView);

	return (
		<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
			<ProjectViewTabs activeView={activeView} onViewChange={onViewChange} />

			<div className="flex flex-wrap items-center gap-3 shrink-0">
				{isFilterable && renderFilter}

				<ProjectMembersGroup
					visibleMembers={visibleMembers}
					remainingCount={remainingCount}
					onAddMember={() => setIsAddMemberModalOpen(true)}
				/>
			</div>

			<AddMemberModal
				open={isAddMemberModalOpen}
				onOpenChange={setIsAddMemberModalOpen}
				scope="project"
				targetId={projectId}
			/>
		</div>
	);
}
