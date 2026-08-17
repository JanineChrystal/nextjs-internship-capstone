"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
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

const groupNameSchema = z
	.string()
	.trim()
	.min(1, "Group name is required")
	.max(80, "Group name must be 80 characters or fewer");

// Raised deliberately by the DAL for the user to read; anything else is
// reported generically so database internals never surface.
const USER_FACING_ERRORS = [
	"A group with that name already exists",
	"Group not found",
	"Project not found",
	"Only the workspace owner can edit groups",
	"Only the workspace owner can delete groups",
];

function toUserFacingError(error: unknown): string {
	if (error instanceof Error && error.message === "Unauthorized") {
		return "You do not have permission to manage groups on this project";
	}
	return error instanceof Error && USER_FACING_ERRORS.includes(error.message)
		? error.message
		: "An unexpected error occurred";
}

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
		return { success: false, error: toUserFacingError(error) };
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
		return { success: false, error: toUserFacingError(error) };
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

		const parsed = groupNameSchema.safeParse(name);
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
		return { success: false, error: toUserFacingError(error) };
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
		return { success: false, error: toUserFacingError(error) };
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
		return { success: false, error: toUserFacingError(error) };
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
		return { success: false, error: toUserFacingError(error) };
	}
}
