"use server";

import { revalidatePath } from "next/cache";
import { GROUP_USER_FACING_ERRORS } from "@/lib/constants/action-errors";
import { getCurrentUser, getSessionFailureReason } from "@/lib/dal/auth";
import {
	applyGroupToProjectDAL,
	deleteGroupDAL,
	getGroupMembersDAL,
	getWorkspaceGroupsDAL,
	saveProjectMembersAsGroupDAL,
	setGroupMembersDAL,
} from "@/lib/dal/groups";
import type { GroupMemberDTO, GroupOutputDTO } from "@/lib/dtos/group-dto";
import { toUserFacingError } from "@/lib/utils/action-error";
import { GroupNameSchema } from "@/lib/validations/group-schema";

// "Unauthorized" is accurate but tells a user nothing, so this one message is
// rewritten to name the permission that is actually missing.
const toGroupError = (error: unknown) =>
	toUserFacingError(error, GROUP_USER_FACING_ERRORS, {
		Unauthorized: "You do not have permission to manage groups on this project",
	});

export async function getWorkspaceGroupsAction(): Promise<{
	success: boolean;
	data?: GroupOutputDTO[];
	error?: string;
}> {
	try {
		const user = await getCurrentUser();
		if (!user)
			return { success: false, error: await getSessionFailureReason() };

		return { success: true, data: await getWorkspaceGroupsDAL() };
	} catch (error) {
		console.error("getWorkspaceGroupsAction error:", error);
		return {
			success: false,
			error: toGroupError(error),
		};
	}
}

export async function getGroupMembersAction(groupId: string): Promise<{
	success: boolean;
	data?: GroupMemberDTO[];
	error?: string;
}> {
	try {
		const user = await getCurrentUser();
		if (!user)
			return { success: false, error: await getSessionFailureReason() };

		return { success: true, data: await getGroupMembersDAL(groupId) };
	} catch (error) {
		console.error("getGroupMembersAction error:", error);
		return {
			success: false,
			error: toGroupError(error),
		};
	}
}

export async function saveProjectMembersAsGroupAction(
	projectId: string,
	name: string,
	description?: string,
): Promise<{ success: boolean; data?: GroupOutputDTO; error?: string }> {
	try {
		const user = await getCurrentUser();
		if (!user)
			return { success: false, error: await getSessionFailureReason() };

		const parsed = GroupNameSchema.safeParse(name);
		if (!parsed.success) {
			return { success: false, error: parsed.error.issues[0]?.message };
		}

		const group = await saveProjectMembersAsGroupDAL(
			projectId,
			parsed.data,
			description,
		);

		revalidatePath(`/projects/${projectId}`);
		return { success: true, data: group };
	} catch (error) {
		console.error("saveProjectMembersAsGroupAction error:", error);
		return {
			success: false,
			error: toGroupError(error),
		};
	}
}

export async function applyGroupToProjectAction(
	projectId: string,
	groupId: string,
	accessLevel: "co-owner" | "member" | "guest" = "member",
): Promise<{ success: boolean; addedCount?: number; error?: string }> {
	try {
		const user = await getCurrentUser();
		if (!user)
			return { success: false, error: await getSessionFailureReason() };

		const { addedCount } = await applyGroupToProjectDAL(
			projectId,
			groupId,
			accessLevel,
		);

		revalidatePath(`/projects/${projectId}`);
		return { success: true, addedCount };
	} catch (error) {
		console.error("applyGroupToProjectAction error:", error);
		return {
			success: false,
			error: toGroupError(error),
		};
	}
}

export async function setGroupMembersAction(
	groupId: string,
	userIds: string[],
): Promise<{ success: boolean; error?: string }> {
	try {
		const user = await getCurrentUser();
		if (!user)
			return { success: false, error: await getSessionFailureReason() };

		await setGroupMembersDAL(groupId, userIds);
		revalidatePath("/projects");
		return { success: true };
	} catch (error) {
		console.error("setGroupMembersAction error:", error);
		return {
			success: false,
			error: toGroupError(error),
		};
	}
}

export async function deleteGroupAction(
	groupId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const user = await getCurrentUser();
		if (!user)
			return { success: false, error: await getSessionFailureReason() };

		await deleteGroupDAL(groupId);
		revalidatePath("/projects");
		return { success: true };
	} catch (error) {
		console.error("deleteGroupAction error:", error);
		return {
			success: false,
			error: toGroupError(error),
		};
	}
}
