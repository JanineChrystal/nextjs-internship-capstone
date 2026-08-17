"use client";

import dynamic from "next/dynamic";
import { PageHeader } from "@/app/(dashboard)/_components/ui/headers/page-header";
import type { RoleAccess } from "@/lib/config/permissions";
import { useProjectStore } from "@/stores/use-project-store";
import { CommentModerationSection } from "./comment-moderation-section";

const TeamAccessSection = dynamic(
	() => import("./team-access-section").then((m) => m.TeamAccessSection),
	{ ssr: false },
);

const DangerZoneSection = dynamic(
	() => import("./danger-zone-section").then((m) => m.DangerZoneSection),
	{ ssr: false },
);

const GroupsSection = dynamic(
	() => import("./groups-section").then((m) => m.GroupsSection),
	{ ssr: false },
);

interface SettingsViewProps {
	projectId: string;
	role: RoleAccess;
}

export function SettingsView({ projectId, role }: SettingsViewProps) {
	const projects = useProjectStore((state) => state.projects);
	const currentProject = projects.find((p) => p.id === projectId);

	// Archiving and deleting are the owner's alone, so a co-owner reaching
	// Settings gets access management without the destructive section. The role
	// is resolved on the server; this is presentation, not the gate.
	const isOwner = role === "owner";

	if (!currentProject) {
		return <div className="p-4 text-error">Project not found</div>;
	}

	return (
		<div className="flex flex-col gap-6 w-full mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
			<PageHeader
				title="Project Settings"
				description={`Manage ${currentProject.title} access, moderation, and advanced settings.`}
			/>

			<TeamAccessSection projectId={projectId} currentUserRole={role} />

			<GroupsSection
				projectId={projectId}
				canManage={role === "owner" || role === "co-owner"}
			/>

			<CommentModerationSection projectId={projectId} />

			{isOwner && (
				<DangerZoneSection
					projectId={projectId}
					projectName={currentProject.title}
					currentUserRole={role}
				/>
			)}
		</div>
	);
}
