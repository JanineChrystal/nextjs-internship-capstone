"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/dal/auth";
import { createProjectInDB } from "@/lib/dal/projects";
import type { ProjectOutputDTO } from "@/lib/dtos/project-dto";
import { createProjectSchema } from "@/lib/validations/project-schema";

export async function createProjectAction(
	workspaceId: string,
	formData: FormData,
): Promise<{ success: boolean; data?: ProjectOutputDTO; error?: string }> {
	try {
		// Auth check
		const user = await getCurrentUser();
		if (!user) {
			return { success: false, error: "Unauthorized" };
		}

		// Parse form data payload
		const rawData = {
			title: formData.get("title"),
			description: formData.get("description"),
			category: formData.get("category"),
			startDate: formData.get("startDate"),
			dueDate: formData.get("dueDate"),
			status: formData.get("status"),
		};

		// Zod Validation
		const validationResult = createProjectSchema.safeParse(rawData);
		if (!validationResult.success) {
			return { success: false, error: "Invalid form data" };
		}

		const data = validationResult.data;

		// DAL Call
		// We map the validated UI input to the Database Schema Type (NewDbProject)
		const statusValue = data.status === "completed" ? "completed" : "active";

		const newProject = await createProjectInDB({
			workspaceId,
			ownerId: user.id,
			name: data.title, // Map UI title to DB name
			description: data.description || null,
			category: data.category || null,
			startDate: data.startDate ? new Date(data.startDate) : null,
			dueDate: data.dueDate ? new Date(data.dueDate) : null,
			status: statusValue,
			priority: "medium", // default
		});

		// Cache Revalidation
		revalidatePath("/projects");

		// Return DTO Payload
		return { success: true, data: newProject };
	} catch (error) {
		console.error("createProjectAction error:", error);
		return { success: false, error: "An unexpected error occurred" };
	}
}
