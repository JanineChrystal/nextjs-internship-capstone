"use client";

import { ChevronLeft, FolderLock } from "lucide-react";
import Link from "next/link";
import { TagBadge } from "@/app/(dashboard)/_components/ui/badges/tag-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { UserProjectCollapsible } from "./user-profile-collapsible";

interface UserProfileViewProps {
	targetUserId: string;
	viewerUserId?: string;
	isSelf: boolean;
}

export function UserProfileView({
	targetUserId: _targetUserId,
	viewerUserId: _viewerUserId,
	isSelf,
}: UserProfileViewProps) {
	// 1. Fetch target user's details & assigned projects
	// 2. Filter projects:
	//    - If `isSelf === true`: return ALL projects targetUser belongs to.
	//    - If `isSelf === false`: return ONLY projects where both targetUser AND viewerUser are members.

	const targetUser = {
		name: "Alex Johnson",
		email: "alex@example.com",
		role: "Frontend Developer",
		avatarUrl: "/avatars/alex.jpg",
	};

	const visibleProjects = [
		{
			id: "prj_1",
			title: "PUP SCRAMPS System",
			jobRole: "UI Designer",
			roleAccess: "member" as const,
			totalTasks: 8,
			completedTasks: 6,
			tasks: [
				{ id: "t1", name: "Design Member Modal", status: "Completed" as const },
				{
					id: "t2",
					name: "Update Primary Color Palette",
					status: "In Progress" as const,
				},
			],
		},
	];

	return (
		<div className="max-w-5xl mx-auto space-y-8 p-6">
			{!isSelf && (
				<div className="flex items-center -mb-2">
					<Link
						href="/team"
						className="flex items-center gap-2 text-sm font-medium text-secondary hover:text-on-surface transition-colors"
					>
						<ChevronLeft className="h-4 w-4" />
						Back to Team
					</Link>
				</div>
			)}
			{/* Profile Header */}
			<div className="flex items-center gap-6 bg-surface p-6 rounded-xl border border-outline-variant shadow-sm">
				<Avatar className="h-20 w-20 border-2 border-primary">
					<AvatarImage src={targetUser.avatarUrl} alt={targetUser.name} />
					<AvatarFallback className="text-xl font-bold bg-primary-container text-on-primary-container">
						AJ
					</AvatarFallback>
				</Avatar>
				<div className="space-y-1">
					<div className="flex items-center gap-3">
						<h1 className="text-2xl font-bold text-foreground">
							{targetUser.name}
						</h1>
						<TagBadge tag={targetUser.role} />
					</div>
					<p className="text-sm text-secondary">{targetUser.email}</p>
				</div>
			</div>

			{/* Projects List Section */}
			<div className="space-y-4">
				<div>
					<h2 className="text-xl font-bold text-foreground">
						{isSelf
							? "My Assigned Projects & Tasks"
							: `Shared Projects with ${targetUser.name}`}
					</h2>
					<p className="text-sm text-secondary">
						{isSelf
							? "Overview of all active projects, completion progress, and assigned responsibilities."
							: "Showing projects and tasks you and this member share together."}
					</p>
				</div>

				{visibleProjects.length > 0 ? (
					<div className="space-y-3">
						{visibleProjects.map((project) => (
							<UserProjectCollapsible key={project.id} project={project} />
						))}
					</div>
				) : (
					<EmptyState
						icon={FolderLock}
						title="No shared projects"
						description="You and this team member do not currently share any common projects."
					/>
				)}
			</div>
		</div>
	);
}
