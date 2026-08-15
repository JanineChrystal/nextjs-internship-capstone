"use client";

import { Plus } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { MemberAvatarChip } from "@/app/(dashboard)/_components/ui/avatars/member-avatar-chip";
import { useMemberStore } from "@/stores/use-member-store";

const AddMemberModal = dynamic(
	() =>
		import("../add-member-modal/add-member-modal").then(
			(m) => m.AddMemberModal,
		),
	{ ssr: false },
);

interface ProjectTeamSectionProps {
	// Undefined in create mode, before the project exists server-side.
	projectId?: string;
}

export function ProjectTeamSection({ projectId }: ProjectTeamSectionProps) {
	const { projectMembers, fetchProjectMembers, removeMember } =
		useMemberStore();
	const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

	const members = projectId ? projectMembers[projectId] || [] : [];

	useEffect(() => {
		if (projectId) fetchProjectMembers(projectId);
	}, [projectId, fetchProjectMembers]);

	return (
		<div className="space-y-2">
			<span className="block font-label-sm text-label-sm text-muted-foreground uppercase tracking-wider">
				Team Members
			</span>

			{!projectId ? (
				<p className="text-sm text-muted-foreground">
					Save the project first to invite team members.
				</p>
			) : (
				<div className="flex items-center gap-3 flex-wrap">
					{members.map((member) => (
						<MemberAvatarChip
							key={member.userId}
							name={member.name}
							avatarUrl={member.avatarUrl}
							onRemove={
								member.roleAccess === "owner"
									? undefined
									: () => removeMember(projectId, member.userId)
							}
						/>
					))}
					<button
						type="button"
						aria-label="Add team member"
						onClick={() => setIsAddMemberOpen(true)}
						className="w-9 h-9 rounded-full border border-dashed border-input flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all"
					>
						<Plus className="w-4 h-4" />
					</button>
				</div>
			)}

			{projectId && (
				<AddMemberModal
					open={isAddMemberOpen}
					onOpenChange={setIsAddMemberOpen}
					scope="project"
					targetId={projectId}
				/>
			)}
		</div>
	);
}
