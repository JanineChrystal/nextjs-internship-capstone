import "server-only";
import { and, desc, eq, inArray, isNotNull, isNull, lt } from "drizzle-orm";
import { daysUntilPurge, toPurgeCutoff } from "@/lib/constants/archive";
import { getCurrentUser } from "@/lib/dal/auth";
import { verifyProjectPermissionDAL } from "@/lib/dal/permissions";
import { getAllUserProjectsDAL } from "@/lib/dal/projects";
import { db } from "@/lib/db";
import { projects, tasks } from "@/lib/db/schema";
import type { ArchivedItemDTO, ArchivePageDTO } from "@/lib/dtos/archive-dto";

/**
 * Archive and Trash.
 *
 * Two nullable timestamps carry the whole model. `archivedAt` means put aside
 * on purpose - hidden from lists, kept forever. `deletedAt` means on the way
 * out - hidden from lists, destroyed after the retention window. An item is in
 * exactly one of three states and the WHERE clause can say which:
 *
 *     archivedAt IS NULL  AND deletedAt IS NULL   ->  live
 *     archivedAt NOT NULL AND deletedAt IS NULL   ->  archived
 *     deletedAt  NOT NULL                         ->  trashed
 *
 * Trashed wins over archived on purpose: moving an archived item to the trash
 * has to take it out of the archive list, and leaving both stamps set is what
 * lets "restore" put it back where it came from.
 *
 * Everything here is scoped through getAllUserProjectsDAL() for the same reason
 * the analytics are - a shared project lives in its owner's workspace, so a
 * workspace-scoped query would show a member an empty archive.
 */

/**
 * Deleting a project would orphan its tasks in the trash list, so both are
 * always resolved together and a task row is only listed when its project is
 * still reachable.
 */
async function loadAccessibleProjectIds(): Promise<{
	ids: string[];
	names: Map<string, string>;
}> {
	// "all", not the default "live". This is the one caller that needs archived
	// and trashed projects in scope - asking for the live set here would make the
	// archive page permanently empty, since every row it wants to list is one the
	// live filter exists to hide.
	const accessible = await getAllUserProjectsDAL("all");
	return {
		ids: accessible.map((project) => project.id),
		names: new Map(accessible.map((project) => [project.id, project.name])),
	};
}

/**
 * Destroys trashed rows whose retention window has closed.
 *
 * Run when the archive page is opened rather than on a schedule. A cron job or
 * a queue worker is the textbook answer and is genuinely better, but it is also
 * infrastructure this project does not have - and a sweep that runs whenever
 * anyone looks at their trash is honest about what it does, needs nothing
 * deployed, and cannot delete anything the retention rule would not have.
 *
 * The trade-off worth naming: an item can outlive its thirty days if nobody
 * opens the page. It is never destroyed early, only late, which is the correct
 * direction for a mistake about deletion to lean.
 */
async function purgeExpired(projectIds: string[]): Promise<number> {
	if (projectIds.length === 0) return 0;

	const cutoff = toPurgeCutoff();

	// Tasks first. Deleting the projects first would cascade their tasks away and
	// leave the second delete counting rows that no longer exist.
	const purgedTasks = await db
		.delete(tasks)
		.where(
			and(
				inArray(tasks.projectId, projectIds),
				isNotNull(tasks.deletedAt),
				lt(tasks.deletedAt, cutoff),
			),
		)
		.returning({ id: tasks.id });

	const purgedProjects = await db
		.delete(projects)
		.where(
			and(
				inArray(projects.id, projectIds),
				isNotNull(projects.deletedAt),
				lt(projects.deletedAt, cutoff),
			),
		)
		.returning({ id: projects.id });

	return purgedTasks.length + purgedProjects.length;
}

export async function getArchivePageDAL(): Promise<ArchivePageDTO> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const { ids, names } = await loadAccessibleProjectIds();
		if (ids.length === 0) {
			return { archived: [], trashed: [], purgedCount: 0 };
		}

		// Swept before reading, so an expired row is never listed with "0 days
		// left" and a Restore button that would bring back something the retention
		// policy already promised was gone.
		const purgedCount = await purgeExpired(ids);

		const [archivedProjects, trashedProjects, archivedTasks, trashedTasks] =
			await Promise.all([
				db
					.select()
					.from(projects)
					.where(
						and(
							inArray(projects.id, ids),
							isNotNull(projects.archivedAt),
							isNull(projects.deletedAt),
						),
					)
					.orderBy(desc(projects.archivedAt)),

				db
					.select()
					.from(projects)
					.where(and(inArray(projects.id, ids), isNotNull(projects.deletedAt)))
					.orderBy(desc(projects.deletedAt)),

				db
					.select()
					.from(tasks)
					.where(
						and(
							inArray(tasks.projectId, ids),
							isNotNull(tasks.archivedAt),
							isNull(tasks.deletedAt),
						),
					)
					.orderBy(desc(tasks.archivedAt)),

				db
					.select()
					.from(tasks)
					.where(and(inArray(tasks.projectId, ids), isNotNull(tasks.deletedAt)))
					.orderBy(desc(tasks.deletedAt)),
			]);

		const toProjectRow = (
			row: typeof projects.$inferSelect,
			at: Date,
			trashed: boolean,
		): ArchivedItemDTO => ({
			id: row.id,
			kind: "project",
			name: row.name,
			projectName: null,
			projectId: row.id,
			at,
			daysLeft: trashed ? daysUntilPurge(at) : null,
		});

		const toTaskRow = (
			row: typeof tasks.$inferSelect,
			at: Date,
			trashed: boolean,
		): ArchivedItemDTO => ({
			id: row.id,
			kind: "task",
			name: row.name,
			projectName: names.get(row.projectId) ?? null,
			projectId: row.projectId,
			at,
			daysLeft: trashed ? daysUntilPurge(at) : null,
		});

		// Interleaved newest-first across both kinds rather than projects-then-tasks:
		// the reader is looking for the thing they just put aside, and that is
		// answered by recency, not by type.
		const byNewest = (a: ArchivedItemDTO, b: ArchivedItemDTO) =>
			b.at.getTime() - a.at.getTime();

		// The queries already filter on IS NOT NULL, but TypeScript cannot see
		// that through drizzle's return type. Filtering again is cheaper than a
		// non-null assertion and stays correct if a query is ever loosened.
		const withStamp = <
			T extends { archivedAt: Date | null; deletedAt: Date | null },
		>(
			rows: T[],
			field: "archivedAt" | "deletedAt",
		): { row: T; at: Date }[] =>
			rows.flatMap((row) => {
				const at = row[field];
				return at ? [{ row, at }] : [];
			});

		return {
			archived: [
				...withStamp(archivedProjects, "archivedAt").map(({ row, at }) =>
					toProjectRow(row, at, false),
				),
				...withStamp(archivedTasks, "archivedAt").map(({ row, at }) =>
					toTaskRow(row, at, false),
				),
			].sort(byNewest),

			trashed: [
				...withStamp(trashedProjects, "deletedAt").map(({ row, at }) =>
					toProjectRow(row, at, true),
				),
				...withStamp(trashedTasks, "deletedAt").map(({ row, at }) =>
					toTaskRow(row, at, true),
				),
			].sort(byNewest),

			purgedCount,
		};
	} catch (error) {
		throw new Error("Failed to fetch archive", { cause: error });
	}
}

/**
 * The five state changes, behind one function.
 *
 * They differ only in which timestamps they write and which permission they
 * demand, so writing five near-identical functions would have meant five places
 * to forget the permission check. The permission is resolved from the operation
 * rather than passed in, so a caller cannot ask for a cheaper one.
 */
export type ArchiveOperation =
	| "archive"
	| "unarchive"
	| "trash"
	| "restore"
	| "purge";

const OPERATION_STAMPS: Record<
	ArchiveOperation,
	{ archivedAt?: Date | null; deletedAt?: Date | null } | "delete"
> = {
	archive: { archivedAt: new Date(0) },
	// Clears only archivedAt. Something both archived and trashed stays in the
	// trash until it is restored - un-archiving must not quietly pull an item
	// back out of a deletion the user asked for.
	unarchive: { archivedAt: null },
	trash: { deletedAt: new Date(0) },
	// Only deletedAt is cleared. An item archived first and then trashed goes
	// back to the archive, not to the live list - restoring should undo the last
	// thing that happened to it, not everything.
	restore: { deletedAt: null },
	purge: "delete",
};

export async function applyArchiveOperationDAL(
	kind: "project" | "task",
	id: string,
	operation: ArchiveOperation,
): Promise<void> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	// Archiving is an edit; trashing and destroying are deletions. A member who
	// may edit a task should be able to put it aside, but only someone who may
	// delete it should be able to start - or finish - its removal.
	const isDestructive = operation !== "archive" && operation !== "unarchive";
	const permission =
		kind === "project"
			? isDestructive
				? ("delete_project" as const)
				: ("edit_project" as const)
			: isDestructive
				? ("delete_task" as const)
				: ("edit_task" as const);

	// A task is governed by its project, so the project id is resolved first -
	// and resolving it from the database rather than trusting a client-supplied
	// one is what stops a caller naming a project they can edit to act on a task
	// in one they cannot.
	let projectId = id;
	if (kind === "task") {
		const [task] = await db
			.select({ projectId: tasks.projectId })
			.from(tasks)
			.where(eq(tasks.id, id));
		if (!task) throw new Error("Task not found");
		projectId = task.projectId;
	}

	// "all", not the default "live" - the same reason loadAccessibleProjectIds
	// needs it above. Every operation here acts on a row that is archived or
	// trashed, and the live scope treats a trashed project as though it does not
	// exist. Under the default, restore and purge could never succeed on a
	// trashed project: the page listed the item, then refused to act on it with
	// "You do not have permission to do that".
	//
	// This widens WHERE the role is looked for, not WHO gets one. The user must
	// still hold delete_project (or delete_task) on the row - a stranger is
	// refused exactly as before.
	const allowed = await verifyProjectPermissionDAL(
		projectId,
		permission,
		"all",
	);
	if (!allowed) throw new Error("Unauthorized");

	const stamps = OPERATION_STAMPS[operation];
	const table = kind === "project" ? projects : tasks;

	try {
		if (stamps === "delete") {
			await db.delete(table).where(eq(table.id, id));
			return;
		}

		// `new Date(0)` in the table above is a placeholder for "stamp it now" -
		// the real timestamp is taken here so it reflects when the operation ran,
		// not when this module was first loaded.
		const values: Record<string, Date | null> = { updatedAt: new Date() };
		if ("archivedAt" in stamps) {
			values.archivedAt = stamps.archivedAt === null ? null : new Date();
		}
		if ("deletedAt" in stamps) {
			values.deletedAt = stamps.deletedAt === null ? null : new Date();
		}

		await db.update(table).set(values).where(eq(table.id, id));
	} catch (error) {
		throw new Error(`Failed to ${operation} ${kind}`, { cause: error });
	}
}
