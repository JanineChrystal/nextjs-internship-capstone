import "server-only";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { projects, tasks } from "@/lib/db/schema";

export async function getUniqueTaskCategoriesDAL(
	projectId: string,
): Promise<string[]> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const results = await db
			.selectDistinct({ category: tasks.category })
			.from(tasks)
			.innerJoin(projects, eq(tasks.projectId, projects.id))
			.where(
				and(
					eq(tasks.projectId, projectId),
					eq(projects.ownerId, user.id),
					isNull(tasks.deletedAt),
					isNull(projects.deletedAt),
					isNotNull(tasks.category),
				),
			);
		return results.map((row) => row.category as string).filter(Boolean);
	} catch (error) {
		throw new Error("Failed to fetch task categories", { cause: error });
	}
}

export async function getUniqueProjectCategoriesDAL(): Promise<string[]> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const results = await db
			.selectDistinct({ category: projects.category })
			.from(projects)
			.where(
				and(
					eq(projects.ownerId, user.id),
					isNull(projects.deletedAt),
					isNotNull(projects.category),
				),
			);
		return results.map((row) => row.category as string).filter(Boolean);
	} catch (error) {
		throw new Error("Failed to fetch project categories", { cause: error });
	}
}
