"use client";

import { useProjectStore } from "@/stores/use-project-store";
import { CommentModerationSection } from "./comment-moderation-section";
import { DangerZoneSection } from "./danger-zone-section";
import { TeamAccessSection } from "./team-access-section";

// This would be fetched from auth context later on
const MOCK_CURRENT_USER_ROLE = "owner";

export function SettingsView({ projectId }: { projectId: string }) {
	const projects = useProjectStore((state) => state.projects);
	const currentProject = projects.find((p) => p.id === projectId);

	if (!currentProject) {
		return <div className="p-4 text-error">Project not found</div>;
	}

	return (
		<div className="flex flex-col gap-8 max-w-5xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
			<div>
				<h1 className="text-3xl font-bold text-on-surface">Project Settings</h1>
				<p className="text-secondary mt-1">
					Manage {currentProject.title} access, moderation, and advanced
					settings.
				</p>
			</div>

			<TeamAccessSection
				projectId={projectId}
				currentUserRole={MOCK_CURRENT_USER_ROLE}
			/>

			<CommentModerationSection projectId={projectId} />

			<DangerZoneSection
				projectId={projectId}
				projectName={currentProject.title}
				currentUserRole={MOCK_CURRENT_USER_ROLE}
			/>
		</div>
	);
}
