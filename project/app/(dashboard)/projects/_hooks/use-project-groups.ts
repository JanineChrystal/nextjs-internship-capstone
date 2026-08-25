"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { emptyMembers } from "@/app/(dashboard)/projects/_constants/settings-view";
import {
	applyGroupToProjectAction,
	deleteGroupAction,
	getGroupMembersAction,
	getWorkspaceGroupsAction,
	saveProjectMembersAsGroupAction,
	syncGroupToProjectMembersAction,
} from "@/lib/actions/group-actions";
import type { GroupMemberDTO, GroupOutputDTO } from "@/lib/dtos/group-dto";
import { isRosterContainedIn, isSameRoster } from "@/lib/utils/roster";
import { reportActionError, reportActionSuccess } from "@/lib/utils/toast";
import { useMemberStore } from "@/stores/use-member-store";

/**
 * use-project-groups hook - manages member groups exclusively within project
 * settings contexts, facilitating rapid population of project member lists from
 * saved snapshots.
 */
export function useProjectGroups(projectId: string) {
	const [groups, setGroups] = useState<GroupOutputDTO[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
	const [groupMembers, setGroupMembers] = useState<GroupMemberDTO[]>([]);

	const fetchProjectMembers = useMemberStore(
		(state) => state.fetchProjectMembers,
	);
	const projectMembers = useMemberStore(
		(state) => state.projectMembers[projectId] ?? emptyMembers,
	);

	/**
	 * project roster - the set every group is compared against, to answer two
	 * questions on each row: is there anything left to add, and has the project
	 * moved on since the group was saved.
	 */
	const projectMemberIds = useMemo(
		() => new Set(projectMembers.map((member) => member.userId)),
		[projectMembers],
	);

	/**
	 * group standing - a group whose people are all on the project already has
	 * nothing to add, which is the case that made "Add to project" look broken in
	 * the project the group was saved from. `isStale` is the inverse question:
	 * the rosters differ, so syncing would change something.
	 */
	const groupStanding = useCallback(
		(group: GroupOutputDTO) => ({
			isFullyApplied: isRosterContainedIn(group.memberIds, projectMemberIds),
			isStale: !isSameRoster(group.memberIds, [...projectMemberIds]),
		}),
		[projectMemberIds],
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
			// server state refresh - forces a re-fetch of project members since applying a group can reinstate previously removed memberships that aren't easily patched locally.
			await fetchProjectMembers(projectId);
		},
		[projectId, fetchProjectMembers],
	);

	const syncGroup = useCallback(
		async (groupId: string) => {
			const result = await syncGroupToProjectMembersAction(groupId, projectId);
			if (!result.success) {
				reportActionError("Could not sync the group", result.error);
				return;
			}
			reportActionSuccess(
				`Group updated to this project's ${result.memberCount} current member${
					result.memberCount === 1 ? "" : "s"
				}.`,
			);
			await load();
			/** roster refresh - the expanded list is fetched separately, so it would keep showing the old members until the group is collapsed and reopened. */
			if (expandedGroupId === groupId) {
				const members = await getGroupMembersAction(groupId);
				if (members.success && members.data) setGroupMembers(members.data);
			}
		},
		[projectId, load, expandedGroupId],
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
		groupStanding,
		toggleGroup,
		saveAsGroup,
		applyGroup,
		syncGroup,
		removeGroup,
	};
}
