"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/dal/auth";
import { createTaskInDB } from "@/lib/dal/tasks";
import type { TaskOutputDTO } from "@/lib/dtos/task-dto";
import { insertTaskDbSchema } from "@/lib/validations/task-schema";

export async function createTaskAction(
	projectId: string,
	boardId: string,
	formData: FormData,
): Promise<{ success: boolean; data?: TaskOutputDTO; error?: string }> {
	try {
		// 1. Auth check
		const user = await getCurrentUser();
		if (!user) {
			return { success: false, error: "Unauthorized" };
		}

		// 2. Parse form data payload
		const rawData = {
			projectId,
			boardId,
			name: formData.get("name"),
			category: formData.get("category"),
			status: formData.get("status") || "Not Started",
			priority: formData.get("priority") || "medium",
			startDate: formData.get("startDate")
				? new Date(formData.get("startDate") as string)
				: undefined,
			dueDate: formData.get("dueDate")
				? new Date(formData.get("dueDate") as string)
				: undefined,
			notes: formData.get("notes"),
		};

		// 3. Zod Validation (Using the DB schema directly for raw backend inserts)
		const validationResult = insertTaskDbSchema.safeParse(rawData);
		if (!validationResult.success) {
			return { success: false, error: "Invalid form data" };
		}

		const data = validationResult.data;

		// 4. DAL Call
		const newTask = await createTaskInDB(data);

		// 5. Cache Revalidation
		revalidatePath(`/projects/${projectId}`);

		// 6. Return DTO Payload
		return { success: true, data: newTask };
	} catch (error) {
		console.error("createTaskAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}
