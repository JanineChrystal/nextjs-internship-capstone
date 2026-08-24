import "server-only";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/dal/auth";
import { getAllUserProjectsDAL } from "@/lib/dal/projects";
import { db } from "@/lib/db";
import {
	projectMembers,
	projects,
	taskAssignees,
	tasks,
	users,
} from "@/lib/db/schema";
import type {
	ProfileProjectData,
	ProfileTask,
	ProfileUser,
} from "@/lib/types/profile";
import { toProfileStatus } from "@/lib/utils/profile";

/**
 * profile visibility rule - you may look at anyone you share a project with,
 * and you see only the projects you share. That keeps a profile from becoming a
 * directory of everything a colleague works on, while still letting the people
 * who actually work together see each other's assignments.
 */
export interface UserProfileDTO {
	user: ProfileUser;
	isSelf: boolean;
	projects: ProfileProjectData[];
}

function toProfileUser(row: typeof users.$inferSelect): ProfileUser {
	const fullName = [row.firstName, row.lastName]
		.filter(Boolean)
		.join(" ")
		.trim();

	return {
		id: row.id,
		name: fullName || row.email.split("@")[0],
		email: row.email,
		avatarUrl: row.imageUrl ?? "",
	};
}

/**
 * get user profile - resolves the person named in the URL and the projects the
 * viewer shares with them, with the tasks assigned to that person inside each.
 *
 * `"me"` is accepted as the id because the sidebar links here without knowing
 * the viewer's database id - it only ever sees the Clerk id, which is not what
 * this route is keyed by.
 */
export async function getUserProfileDAL(
	targetUserId: string,
): Promise<UserProfileDTO | null> {
	const viewer = await getCurrentUser();
	if (!viewer) throw new Error("Unauthorized");

	const resolvedId = targetUserId === "me" ? viewer.id : targetUserId;
	const isSelf = resolvedId === viewer.id;

	const [targetRow] = await db
		.select()
		.from(users)
		.where(and(eq(users.id, resolvedId), isNull(users.deletedAt)));

	if (!targetRow) return null;

	/** viewer scope - every project the viewer can reach, which is the outer bound of what this page may ever show. */
	const viewerProjects = await getAllUserProjectsDAL();
	if (viewerProjects.length === 0) {
		return { user: toProfileUser(targetRow), isSelf, projects: [] };
	}

	const viewerProjectIds = viewerProjects.map((project) => project.id);

	/**
	 * shared scope - for another person, narrow to the projects they are also on.
	 * Ownership counts as membership: a project owner has no ProjectMembers row,
	 * so checking that table alone would hide every project they own.
	 */
	let sharedProjectIds = viewerProjectIds;
	if (!isSelf) {
		const memberships = await db
			.select({ projectId: projectMembers.projectId })
			.from(projectMembers)
			.where(
				and(
					eq(projectMembers.userId, resolvedId),
					inArray(projectMembers.projectId, viewerProjectIds),
					isNull(projectMembers.deletedAt),
				),
			);

		const owned = await db
			.select({ id: projects.id })
			.from(projects)
			.where(
				and(
					eq(projects.ownerId, resolvedId),
					inArray(projects.id, viewerProjectIds),
				),
			);

		sharedProjectIds = Array.from(
			new Set([
				...memberships.map((row) => row.projectId),
				...owned.map((row) => row.id),
			]),
		);
	}

	if (sharedProjectIds.length === 0) {
		return { user: toProfileUser(targetRow), isSelf, projects: [] };
	}

	/** assigned tasks - one query across every shared project, then grouped in memory, so the cost does not scale with the number of projects. */
	const assignedRows = await db
		.select({
			id: tasks.id,
			name: tasks.name,
			status: tasks.status,
			isCompleted: tasks.isCompleted,
			projectId: tasks.projectId,
		})
		.from(taskAssignees)
		.innerJoin(tasks, eq(taskAssignees.taskId, tasks.id))
		.where(
			and(
				eq(taskAssignees.userId, resolvedId),
				inArray(tasks.projectId, sharedProjectIds),
				isNull(taskAssignees.deletedAt),
				isNull(tasks.deletedAt),
				isNull(tasks.archivedAt),
			),
		);

	const positions = await db
		.select({
			projectId: projectMembers.projectId,
			position: projectMembers.position,
			accessLevel: projectMembers.accessLevel,
		})
		.from(projectMembers)
		.where(
			and(
				eq(projectMembers.userId, resolvedId),
				inArray(projectMembers.projectId, sharedProjectIds),
				isNull(projectMembers.deletedAt),
			),
		);

	const positionByProject = new Map(
		positions.map((row) => [row.projectId, row]),
	);

	const tasksByProject = new Map<string, ProfileTask[]>();
	for (const row of assignedRows) {
		const list = tasksByProject.get(row.projectId) ?? [];
		list.push({
			id: row.id,
			name: row.name,
			status: toProfileStatus(row),
		});
		tasksByProject.set(row.projectId, list);
	}

	const shared = viewerProjects.filter((project) =>
		sharedProjectIds.includes(project.id),
	);

	const profileProjects: ProfileProjectData[] = shared.map((project) => {
		const assigned = tasksByProject.get(project.id) ?? [];
		const membership = positionByProject.get(project.id);

		return {
			id: project.id,
			title: project.name,
			jobRole: membership?.position ?? "Project Owner",
			roleAccess: membership?.accessLevel ?? "owner",
			totalTasks: assigned.length,
			completedTasks: assigned.filter((task) => task.status === "Completed")
				.length,
			tasks: assigned,
		};
	});

	/** assignment-first ordering - projects where this person actually has work come before ones they are merely a member of. */
	profileProjects.sort((a, b) => b.totalTasks - a.totalTasks);

	return { user: toProfileUser(targetRow), isSelf, projects: profileProjects };
}
