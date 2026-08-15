import { useCallback, useEffect } from "react";
import { useMemberStore } from "@/stores/use-member-store";
import type { RoleAccess } from "@/types/member";
import { emptyMembers } from "../_constants/settings-view";

export function useTeamAccess(projectId: string, currentUserRole: RoleAccess) {
	// Global hooks (Zustand)
	const {
		projectMembers,
		isProjectPublic,
		toggleProjectVisibility,
		updateMemberRoleAccess,
		updateMemberJobRole,
		removeMember,
		fetchProjectMembers,
	} = useMemberStore();

	// Effects
	useEffect(() => {
		if (projectId) fetchProjectMembers(projectId);
	}, [projectId, fetchProjectMembers]);

	// Derived state (with stable reference fallback)
	const members = projectMembers[projectId] ?? emptyMembers;
	const isPublic = isProjectPublic[projectId] ?? false;

	const canManageMembers =
		currentUserRole === "owner" || currentUserRole === "co-owner";

	// Handlers
	const handleRoleChange = useCallback(
		(userId: string, newRole: RoleAccess) => {
			updateMemberRoleAccess(projectId, userId, newRole);
		},
		[projectId, updateMemberRoleAccess],
	);

	const handleJobRoleChange = useCallback(
		(userId: string, newJobRole: string) => {
			updateMemberJobRole(projectId, userId, newJobRole);
		},
		[projectId, updateMemberJobRole],
	);

	const handleToggleVisibility = useCallback(() => {
		toggleProjectVisibility(projectId, !isPublic);
	}, [projectId, isPublic, toggleProjectVisibility]);

	const handleRemoveMember = useCallback(
		(userId: string) => {
			removeMember(projectId, userId);
		},
		[projectId, removeMember],
	);

	return {
		members,
		isPublic,
		canManageMembers,
		handleRoleChange,
		handleJobRoleChange,
		handleToggleVisibility,
		handleRemoveMember,
	};
}
