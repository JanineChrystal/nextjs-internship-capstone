"use client";

import { PageHeader } from "@/app/(dashboard)/_components/ui/headers/page-header";
import { useProjectStore } from "@/stores/use-project-store";
import { mockCurrentUserRole } from "../../../_constants/settings-view";
import { CommentModerationSection } from "./comment-moderation-section";
import { DangerZoneSection } from "./danger-zone-section";
import { TeamAccessSection } from "./team-access-section";

export function SettingsView({ projectId }: { projectId: string }) {
	const projects = useProjectStore((state) => state.projects);
	const currentProject = projects.find((p) => p.id === projectId);

	if (!currentProject) {
		return <div className="p-4 text-error">Project not found</div>;
	}

	return (
		<div className="flex flex-col gap-6 w-full mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
			<PageHeader
				title="Project Settings"
				description={`Manage ${currentProject.title} access, moderation, and advanced settings.`}
			/>

			<TeamAccessSection
				projectId={projectId}
				currentUserRole={mockCurrentUserRole}
			/>

			<CommentModerationSection projectId={projectId} />

			<DangerZoneSection
				projectId={projectId}
				projectName={currentProject.title}
				currentUserRole={mockCurrentUserRole}
			/>
		</div>
	);
}
