import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import {
	hasPermission,
	type Permission,
	type RoleAccess,
} from "@/lib/config/permissions";
import { getCurrentUser } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { projectMembers, projects } from "@/lib/db/schema";

export async function verifyProjectPermissionDAL(
	projectId: string,
	permission: Permission,
): Promise<boolean> {
	const user = await getCurrentUser();
	if (!user) return false;

	// Check if user is the owner of the project
	const [project] = await db
		.select()
		.from(projects)
		.where(and(eq(projects.id, projectId), isNull(projects.deletedAt)));

	if (!project) return false;

	if (project.ownerId === user.id) {
		return hasPermission("owner", permission);
	}

	// Check project membership
	const [member] = await db
		.select()
		.from(projectMembers)
		.where(
			and(
				eq(projectMembers.projectId, projectId),
				eq(projectMembers.userId, user.id),
				isNull(projectMembers.deletedAt),
			),
		);

	if (!member) return false;

	return hasPermission(member.accessLevel as RoleAccess, permission);
}
