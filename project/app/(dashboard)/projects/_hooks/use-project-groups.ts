"use client";

import { useCallback, useEffect, useState } from "react";
import {
	applyGroupToProjectAction,
	deleteGroupAction,
	getGroupMembersAction,
	getWorkspaceGroupsAction,
	saveProjectMembersAsGroupAction,
} from "@/lib/actions/group-actions";
import type { GroupMemberDTO, GroupOutputDTO } from "@/lib/dtos/group-dto";
import { reportActionError, reportActionSuccess } from "@/lib/utils/toast";
import { useMemberStore } from "@/stores/use-member-store";

/**
 * Groups seen from inside a project's settings - the only place they are
 * surfaced, since they are a convenience for filling a project's member list
 * rather than an entity with a page of its own.
 */
export function useProjectGroups(projectId: string) {
	const [groups, setGroups] = useState<GroupOutputDTO[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
	const [groupMembers, setGroupMembers] = useState<GroupMemberDTO[]>([]);

	const fetchProjectMembers = useMemberStore(
		(state) => state.fetchProjectMembers,
	);

	const load = useCallback(async () => {
		setIsLoading(true);
		const result = await getWorkspaceGroupsAction();
		if (result.success && result.data) {
			setGroups(result.data);
		} else if (result.error) {
			reportActionError("Could not load groups", result.error);
		}
		setIsLoading(false);
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const toggleGroup = useCallback(
		async (groupId: string) => {
			if (expandedGroupId === groupId) {
				setExpandedGroupId(null);
				setGroupMembers([]);
				return;
			}

			setExpandedGroupId(groupId);
			const result = await getGroupMembersAction(groupId);
			if (result.success && result.data) {
				setGroupMembers(result.data);
			} else {
				reportActionError("Could not load group members", result.error);
			}
		},
		[expandedGroupId],
	);

	const saveAsGroup = useCallback(
		async (name: string) => {
			const result = await saveProjectMembersAsGroupAction(projectId, name);
			if (!result.success) {
				reportActionError("Could not save group", result.error);
				return false;
			}
			reportActionSuccess(`Saved "${name}" with the current members.`);
			await load();
			return true;
		},
		[projectId, load],
	);

	const applyGroup = useCallback(
		async (groupId: string) => {
			const result = await applyGroupToProjectAction(projectId, groupId);
			if (!result.success) {
				reportActionError("Could not add group members", result.error);
				return;
			}
			reportActionSuccess(
				result.addedCount
					? `Added ${result.addedCount} member(s) from the group.`
					: "Everyone in that group is already on this project.",
			);
			// The member table is server-backed, so it has to be re-read rather than
			// patched: applying a group can resurrect previously removed rows.
			await fetchProjectMembers(projectId);
		},
		[projectId, fetchProjectMembers],
	);

	const removeGroup = useCallback(
		async (groupId: string) => {
			const previous = groups;
			setGroups((current) => current.filter((g) => g.id !== groupId));

			const result = await deleteGroupAction(groupId);
			if (!result.success) {
				setGroups(previous);
				reportActionError("Could not delete group", result.error);
				return;
			}
			reportActionSuccess(
				"Group deleted. Projects created from it are unchanged.",
			);
		},
		[groups],
	);

	return {
		groups,
		isLoading,
		expandedGroupId,
		groupMembers,
		toggleGroup,
		saveAsGroup,
		applyGroup,
		removeGroup,
	};
}
