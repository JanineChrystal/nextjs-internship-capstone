import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { type ProjectOutputDTO, toProjectDTO } from "@/lib/dtos/project-dto";
import type { NewDbProject } from "@/lib/types/project";

export async function createProjectInDB(
	data: NewDbProject,
): Promise<ProjectOutputDTO> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	if (data.ownerId !== user.clerkId && data.ownerId !== user.id) {
		throw new Error("Unauthorized: Cannot create project for another user");
	}

	try {
		const result = await db.insert(projects).values(data).returning();

		return toProjectDTO(result[0]);
	} catch (error) {
		throw new Error("Failed to create project in database", { cause: error });
	}
}

export async function getProjectById(
	projectId: string,
): Promise<ProjectOutputDTO | null> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const [project] = await db
			.select()
			.from(projects)
			.where(
				and(
					eq(projects.id, projectId),
					eq(projects.ownerId, user.id),
					isNull(projects.deletedAt),
				),
			);

		if (!project) return null;

		return toProjectDTO(project);
	} catch (error) {
		throw new Error("Failed to fetch project from database", { cause: error });
	}
}
