import "server-only";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import {
	boards,
	projectMembers,
	projects,
	projectTeams,
	users,
	workspaceMembers,
	workspaces,
} from "@/lib/db/schema";
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
		return await db.transaction(async (tx) => {
			let activeWorkspaceId = data.workspaceId;

			// Resolve workspaceId if missing or a placeholder
			if (!activeWorkspaceId || activeWorkspaceId === "default") {
				const userWorkspaces = await tx
					.select()
					.from(workspaces)
					.where(eq(workspaces.ownerId, user.id));

				if (userWorkspaces.length > 0) {
					activeWorkspaceId = userWorkspaces[0].id;
				} else {
					throw new Error("No active workspace found for user");
				}
			}

			const [newProject] = await tx
				.insert(projects)
				.values({ ...data, workspaceId: activeWorkspaceId })
				.returning();

			// Hook B: Board Column Seeding
			await tx.insert(boards).values([
				{
					projectId: newProject.id,
					workspaceId: activeWorkspaceId,
					name: "To Do",
					position: 0,
				},
				{
					projectId: newProject.id,
					workspaceId: activeWorkspaceId,
					name: "In Progress",
					position: 1,
				},
				{
					projectId: newProject.id,
					workspaceId: activeWorkspaceId,
					name: "Completed",
					position: 2,
				},
			]);

			return toProjectDTO(newProject);
		});
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

export async function getProjectsByWorkspaceId(
	workspaceId: string,
): Promise<ProjectOutputDTO[]> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const results = await db
			.select()
			.from(projects)
			.where(
				and(
					eq(projects.workspaceId, workspaceId),
					eq(projects.ownerId, user.id),
					isNull(projects.deletedAt),
				),
			);

		return results.map(toProjectDTO);
	} catch (error) {
		throw new Error("Failed to fetch projects from database", { cause: error });
	}
}

export async function getAllUserProjectsDAL(): Promise<ProjectOutputDTO[]> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const results = await db
			.select()
			.from(projects)
			.where(and(eq(projects.ownerId, user.id), isNull(projects.deletedAt)));

		return results.map(toProjectDTO);
	} catch (error) {
		throw new Error("Failed to fetch user projects from database", {
			cause: error,
		});
	}
}

export async function updateProjectInDB(
	projectId: string,
	data: Partial<NewDbProject>,
): Promise<ProjectOutputDTO> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const result = await db
			.update(projects)
			.set({ ...data, updatedAt: new Date() })
			.where(
				and(
					eq(projects.id, projectId),
					eq(projects.ownerId, user.id),
					isNull(projects.deletedAt),
				),
			)
			.returning();

		if (result.length === 0) throw new Error("Project not found");

		return toProjectDTO(result[0]);
	} catch (error) {
		throw new Error("Failed to update project in database", { cause: error });
	}
}

export async function deleteProjectInDB(projectId: string): Promise<void> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		await db
			.update(projects)
			.set({ deletedAt: new Date(), updatedAt: new Date() })
			.where(
				and(
					eq(projects.id, projectId),
					eq(projects.ownerId, user.id),
					isNull(projects.deletedAt),
				),
			);
	} catch (error) {
		throw new Error("Failed to delete project in database", { cause: error });
	}
}

export async function bulkDeleteProjectsInDB(
	projectIds: string[],
): Promise<void> {
	if (projectIds.length === 0) return;
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		await db
			.update(projects)
			.set({ deletedAt: new Date(), updatedAt: new Date() })
			.where(
				and(
					inArray(projects.id, projectIds),
					eq(projects.ownerId, user.id),
					isNull(projects.deletedAt),
				),
			);
	} catch (error) {
		throw new Error("Failed to bulk delete projects in database", {
			cause: error,
		});
	}
}

export async function bulkArchiveProjectsInDB(
	projectIds: string[],
): Promise<void> {
	if (projectIds.length === 0) return;
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		await db
			.update(projects)
			.set({ status: "archived", updatedAt: new Date() })
			.where(
				and(
					inArray(projects.id, projectIds),
					eq(projects.ownerId, user.id),
					isNull(projects.deletedAt),
				),
			);
	} catch (error) {
		throw new Error("Failed to bulk archive projects in database", {
			cause: error,
		});
	}
}

export async function bulkCompleteProjectsInDB(
	projectIds: string[],
): Promise<void> {
	if (projectIds.length === 0) return;
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		await db
			.update(projects)
			.set({ status: "completed", updatedAt: new Date() })
			.where(
				and(
					inArray(projects.id, projectIds),
					eq(projects.ownerId, user.id),
					isNull(projects.deletedAt),
				),
			);
	} catch (error) {
		throw new Error("Failed to bulk complete projects in database", {
			cause: error,
		});
	}
}

export async function inviteUserToProjectInDB(
	projectId: string,
	email: string,
	jobRole = "Contributor",
	accessLevel: "co-owner" | "member" | "guest" = "member",
): Promise<void> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		await db.transaction(async (tx) => {
			const [targetUser] = await tx
				.select()
				.from(users)
				.where(eq(users.email, email));

			if (!targetUser) throw new Error("User not found");

			const [project] = await tx
				.select()
				.from(projects)
				.where(eq(projects.id, projectId));

			if (!project) throw new Error("Project not found");

			await tx
				.insert(workspaceMembers)
				.values({
					workspaceId: project.workspaceId,
					userId: targetUser.id,
					status: "active",
				})
				.onConflictDoNothing();

			await tx
				.insert(projectMembers)
				.values({
					projectId: projectId,
					userId: targetUser.id,
					position: jobRole,
					accessLevel,
				})
				.onConflictDoUpdate({
					target: [projectMembers.projectId, projectMembers.userId],
					set: { deletedAt: null, position: jobRole, accessLevel },
				});
		});
	} catch (error) {
		if (error instanceof Error && error.message === "User not found")
			throw error;
		throw new Error("Failed to invite user to project", { cause: error });
	}
}

export interface ProjectMemberOutputDTO {
	userId: string;
	name: string;
	email: string;
	avatarUrl: string;
}

function toMemberName(user: {
	firstName: string | null;
	lastName: string | null;
	email: string;
}): string {
	const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
	return fullName || user.email;
}

export async function getProjectMembersDAL(
	projectId: string,
): Promise<ProjectMemberOutputDTO[]> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const [project] = await db
			.select()
			.from(projects)
			.where(and(eq(projects.id, projectId), isNull(projects.deletedAt)));

		if (!project) return [];

		const [owner] = await db
			.select()
			.from(users)
			.where(eq(users.id, project.ownerId));

		const memberRows = await db
			.select({ user: users })
			.from(projectMembers)
			.innerJoin(users, eq(projectMembers.userId, users.id))
			.where(
				and(
					eq(projectMembers.projectId, projectId),
					isNull(projectMembers.deletedAt),
				),
			);

		const members: ProjectMemberOutputDTO[] = [];
		if (owner) {
			members.push({
				userId: owner.id,
				name: toMemberName(owner),
				email: owner.email,
				avatarUrl: owner.imageUrl ?? "",
			});
		}
		for (const { user: member } of memberRows) {
			if (members.some((m) => m.userId === member.id)) continue;
			members.push({
				userId: member.id,
				name: toMemberName(member),
				email: member.email,
				avatarUrl: member.imageUrl ?? "",
			});
		}

		return members;
	} catch (error) {
		throw new Error("Failed to fetch project members from database", {
			cause: error,
		});
	}
}

export interface ProjectMemberDetailedOutputDTO {
	userId: string;
	name: string;
	email: string;
	avatarUrl: string;
	jobRole: string;
	roleAccess: "owner" | "co-owner" | "member" | "guest";
	status: "joined";
	joinedAt: string;
}

export async function getProjectMembersDetailedDAL(
	projectId: string,
): Promise<ProjectMemberDetailedOutputDTO[]> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const [project] = await db
			.select()
			.from(projects)
			.where(and(eq(projects.id, projectId), isNull(projects.deletedAt)));

		if (!project) return [];

		const [owner] = await db
			.select()
			.from(users)
			.where(eq(users.id, project.ownerId));

		const memberRows = await db
			.select({ member: projectMembers, user: users })
			.from(projectMembers)
			.innerJoin(users, eq(projectMembers.userId, users.id))
			.where(
				and(
					eq(projectMembers.projectId, projectId),
					isNull(projectMembers.deletedAt),
				),
			);

		const members: ProjectMemberDetailedOutputDTO[] = [];
		if (owner) {
			members.push({
				userId: owner.id,
				name: toMemberName(owner),
				email: owner.email,
				avatarUrl: owner.imageUrl ?? "",
				jobRole: "Project Owner",
				roleAccess: "owner",
				status: "joined",
				joinedAt: project.createdAt.toISOString(),
			});
		}
		for (const row of memberRows) {
			if (members.some((m) => m.userId === row.user.id)) continue;
			members.push({
				userId: row.user.id,
				name: toMemberName(row.user),
				email: row.user.email,
				avatarUrl: row.user.imageUrl ?? "",
				jobRole: row.member.position,
				roleAccess: row.member.accessLevel,
				status: "joined",
				joinedAt: row.member.createdAt.toISOString(),
			});
		}

		return members;
	} catch (error) {
		throw new Error("Failed to fetch project members from database", {
			cause: error,
		});
	}
}

export async function updateMemberRoleInDB(
	projectId: string,
	userId: string,
	accessLevel: "co-owner" | "member" | "guest",
): Promise<void> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		await db
			.update(projectMembers)
			.set({ accessLevel, updatedAt: new Date() })
			.where(
				and(
					eq(projectMembers.projectId, projectId),
					eq(projectMembers.userId, userId),
					isNull(projectMembers.deletedAt),
				),
			);
	} catch (error) {
		throw new Error("Failed to update member role", { cause: error });
	}
}

export async function updateMemberJobRoleInDB(
	projectId: string,
	userId: string,
	jobRole: string,
): Promise<void> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		await db
			.update(projectMembers)
			.set({ position: jobRole, updatedAt: new Date() })
			.where(
				and(
					eq(projectMembers.projectId, projectId),
					eq(projectMembers.userId, userId),
					isNull(projectMembers.deletedAt),
				),
			);
	} catch (error) {
		throw new Error("Failed to update member job role", { cause: error });
	}
}

export async function removeMemberFromProjectDAL(
	projectId: string,
	userId: string,
): Promise<void> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		await db
			.update(projectMembers)
			.set({ deletedAt: new Date(), updatedAt: new Date() })
			.where(
				and(
					eq(projectMembers.projectId, projectId),
					eq(projectMembers.userId, userId),
					isNull(projectMembers.deletedAt),
				),
			);
	} catch (error) {
		throw new Error("Failed to remove member from project", { cause: error });
	}
}

export async function assignTeamToProjectInDB(
	projectId: string,
	teamId: string,
	accessLevel: "owner" | "co-owner" | "member" | "guest" = "member",
): Promise<void> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		await db
			.insert(projectTeams)
			.values({
				projectId,
				teamId,
				accessLevel,
			})
			.onConflictDoNothing();
	} catch (error) {
		throw new Error("Failed to assign team to project", { cause: error });
	}
}
