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
		const user = await getCurrentUser();
		if (!user) {
			return { success: false, error: "Unauthorized" };
		}

		// Parse
		const rawData = {
			title: formData.get("title"),
			description: formData.get("description"),
			category: formData.get("category"),
			startDate: formData.get("startDate"),
			dueDate: formData.get("dueDate"),
			status: formData.get("status"),
		};

		// ZOD
		const validationResult = createProjectSchema.safeParse(rawData);
		if (!validationResult.success) {
			return { success: false, error: "Invalid form data" };
		}

		const data = validationResult.data;

		// DAL Call
		const statusValue = data.status === "completed" ? "completed" : "active";

		const newProject = await createProjectInDB({
			workspaceId,
			ownerId: user.id,
			name: data.title,
			description: data.description || null,
			category: data.category || null,
			startDate: data.startDate ? new Date(data.startDate) : null,
			dueDate: data.dueDate ? new Date(data.dueDate) : null,
			status: statusValue,
			priority: "medium",
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
