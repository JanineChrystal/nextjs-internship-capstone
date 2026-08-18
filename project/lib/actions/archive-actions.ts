"use server";

import { revalidatePath } from "next/cache";
import {
	type ArchiveOperation,
	applyArchiveOperationDAL,
} from "@/lib/dal/archive";
import { getCurrentUser, getSessionFailureReason } from "@/lib/dal/auth";
import type { ArchivedItemKind } from "@/lib/dtos/archive-dto";

/**
 * The five archive operations, as one action.
 *
 * The permission decision lives in the DAL, which resolves a task's project
 * itself rather than trusting anything sent from the browser. This layer only
 * turns a thrown error into the { success, error } shape the client hooks
 * already expect.
 *
 * Both /archive and /projects are revalidated because every one of these
 * operations moves an item between the two - archiving something from the
 * projects page has to remove it there as well as add it here.
 */
export async function applyArchiveOperationAction(
	kind: ArchivedItemKind,
	id: string,
	operation: ArchiveOperation,
): Promise<{ success: boolean; error?: string }> {
	try {
		const user = await getCurrentUser();
		if (!user)
			return { success: false, error: await getSessionFailureReason() };

		await applyArchiveOperationDAL(kind, id, operation);

		revalidatePath("/archive");
		revalidatePath("/projects");
		return { success: true };
	} catch (error) {
		console.error("applyArchiveOperationAction error:", error);
		return {
			success: false,
			error:
				error instanceof Error && error.message === "Unauthorized"
					? "You do not have permission to do that"
					: "Could not complete that action",
		};
	}
}
