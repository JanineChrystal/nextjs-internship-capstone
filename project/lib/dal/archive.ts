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
 * archive data model - manages state via two nullable timestamps
 * (archivedAt and deletedAt), where trash precedence removes items
 * from active/archived views while allowing precise restorations.
 * Scoping uses reachable projects.
 */

/**
 * load accessible project ids - resolves available projects to ensure
 * tasks are only listed in the archive/trash if their parent project
 * is still reachable.
 */
async function loadAccessibleProjectIds(): Promise<{
	ids: string[];
	names: Map<string, string>;
}> {
	/**
	 * include non live projects - explicitly requests all project states
	 * to ensure archived and trashed rows are visible, overriding the
	 * default live filter.
	 */
	const accessible = await getAllUserProjectsDAL("all");
	return {
		ids: accessible.map((project) => project.id),
		names: new Map(accessible.map((project) => [project.id, project.name])),
	};
}

/**
 * purge expired items - lazily destroys expired trash rows when the
 * archive page is accessed. This avoids external infrastructure
 * requirements while ensuring items are only ever deleted late, never
 * early.
 */
async function purgeExpired(projectIds: string[]): Promise<number> {
	if (projectIds.length === 0) return 0;

	const cutoff = toPurgeCutoff();

	/** sequence deletions - purges tasks before projects to prevent database cascades from misreporting the number of deleted rows. */
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

		/**
		 * pre read sweep - purges expired rows before returning lists so
		 * the UI does not display un-restorable items with 0 days left.
		 */
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

		/**
		 * sort interleaved recency - sorts items globally by recency
		 * rather than grouped by type, optimizing for users looking for
		 * their most recently dismissed items.
		 */
		const byNewest = (a: ArchivedItemDTO, b: ArchivedItemDTO) =>
			b.at.getTime() - a.at.getTime();

		/**
		 * runtime null guard - provides an explicit runtime check for
		 * timestamps that satisfies TypeScript types, remaining safe even
		 * if query constraints loosen later.
		 */
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
 * apply archive operation - unifies all five state transitions behind
 * one interface to prevent duplicated logic and ensure permission
 * checks are securely resolved by the operation type.
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
	/**
	 * safe unarchive - clears only the archivedAt stamp, ensuring that
	 * an item also in the trash remains deleted rather than unexpectedly
	 * becoming live.
	 */
	unarchive: { archivedAt: null },
	trash: { deletedAt: new Date(0) },
	/**
	 * accurate restore - clears only the deletedAt stamp so that items
	 * originally trashed from the archive return to the archive instead
	 * of the live view.
	 */
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

	/**
	 * map destructive permissions - classifies archiving as an edit and
	 * trashing/purging as a deletion to enforce strict role-based access
	 * limits.
	 */
	const isDestructive = operation !== "archive" && operation !== "unarchive";
	const permission =
		kind === "project"
			? isDestructive
				? ("delete_project" as const)
				: ("edit_project" as const)
			: isDestructive
				? ("delete_task" as const)
				: ("edit_task" as const);

	/**
	 * secure project resolution - fetches the parent project directly
	 * from the DB to prevent callers from bypassing permissions using a
	 * spoofed project ID.
	 */
	let projectId = id;
	if (kind === "task") {
		const [task] = await db
			.select({ projectId: tasks.projectId })
			.from(tasks)
			.where(eq(tasks.id, id));
		if (!task) throw new Error("Task not found");
		projectId = task.projectId;
	}

	/**
	 * verify permissions globally - checks permissions across 'all'
	 * project states rather than just 'live', preventing valid restores
	 * on trashed items from failing with unauthorized errors.
	 */
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

		/**
		 * dynamic timestamp evaluation - substitutes placeholder dates with
		 * fresh values so mutations reflect the exact execution time rather
		 * than module load time.
		 */
		const values: Record<string, Date | null | string> = {
			updatedAt: new Date(),
		};
		if ("archivedAt" in stamps) {
			values.archivedAt = stamps.archivedAt === null ? null : new Date();

			/**
			 * status mirror - projects carry archived-ness twice, as archivedAt and
			 * as a status value, and the two are read by different screens. Writing
			 * only one leaves a project that is archived on one page and live on
			 * another, which is the bug this pairing exists to prevent.
			 */
			if (kind === "project") {
				values.status = stamps.archivedAt === null ? "active" : "archived";
			}
		}
		if ("deletedAt" in stamps) {
			values.deletedAt = stamps.deletedAt === null ? null : new Date();
		}

		await db.update(table).set(values).where(eq(table.id, id));
	} catch (error) {
		throw new Error(`Failed to ${operation} ${kind}`, { cause: error });
	}
}
