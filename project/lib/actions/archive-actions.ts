"use server";

import { revalidatePath } from "next/cache";
import {
	type ArchiveOperation,
	applyArchiveOperationDAL,
} from "@/lib/dal/archive";
import { getCurrentUser, getSessionFailureReason } from "@/lib/dal/auth";
import type { ArchivedItemKind } from "@/lib/dtos/archive-dto";

/**
 * archive actions - handles all archive operations through a single
 * action, delegating permissions to the DAL and revalidating
 * necessary paths.
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
