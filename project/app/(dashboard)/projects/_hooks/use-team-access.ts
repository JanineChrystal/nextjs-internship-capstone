import { useCallback, useEffect } from "react";
import type { RoleAccess } from "@/lib/types/member";
import { useMemberStore } from "@/stores/use-member-store";
import { emptyMembers } from "../_constants/settings-view";

export function useTeamAccess(projectId: string, currentUserRole: RoleAccess) {
	// Global hooks (Zustand)
	const {
		projectMembers,
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

	const handleRemoveMember = useCallback(
		(userId: string) => {
			removeMember(projectId, userId);
		},
		[projectId, removeMember],
	);

	return {
		members,
		canManageMembers,
		handleRoleChange,
		handleJobRoleChange,
		handleRemoveMember,
	};
}
