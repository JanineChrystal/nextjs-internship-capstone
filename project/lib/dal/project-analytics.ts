import "server-only";
import { and, asc, eq, isNull } from "drizzle-orm";
import { PRIORITY_COLUMN_ORDER } from "@/lib/constants/analytics";
import { getEffectiveProjectRoleDAL } from "@/lib/dal/permissions";
import { db } from "@/lib/db";
import { boards, taskAssignees, tasks, users } from "@/lib/db/schema";
import type {
	ProjectAnalyticsDTO,
	StackedGroupDTO,
} from "@/lib/dtos/analytics-dto";
import { toStatusBucket } from "@/lib/utils/task-status";

/**
 * The four panels on a project's Charts tab: Status, Priority, Bucket, Members.
 *
 * Three of the four are the same question asked about a different column -
 * "how do this project's tasks split by status, grouped by X" - so they are
 * built by one helper (toStackedGroups) rather than three near-identical loops.
 * Adding a fifth grouping later is one more call, not one more loop.
 *
 * Gated by project role rather than by the accessible-projects list: this takes
 * an id straight from the URL, so it has to prove the caller may read that
 * specific project before it reads anything at all.
 */

/** Every field the four panels need, in one query. */
interface ProjectTaskRow {
	id: string;
	isCompleted: boolean;
	status: string;
	statusOverriddenAt: Date | null;
	priority: string;
	dueDate: Date | null;
	boardName: string;
}

const UNASSIGNED_LABEL = "Unassigned";

async function loadProjectTasks(projectId: string): Promise<ProjectTaskRow[]> {
	return db
		.select({
			id: tasks.id,
			isCompleted: tasks.isCompleted,
			status: tasks.status,
			statusOverriddenAt: tasks.statusOverriddenAt,
			priority: tasks.priority,
			dueDate: tasks.dueDate,
			boardName: boards.name,
		})
		.from(tasks)
		.innerJoin(boards, eq(tasks.boardId, boards.id))
		.where(and(eq(tasks.projectId, projectId), isNull(tasks.deletedAt)))
		.orderBy(asc(boards.position));
}

/**
 * Who each task is assigned to, one row per assignment.
 *
 * A LEFT JOIN would have been wrong here: a task with no assignee must still
 * appear in the Members chart under "Unassigned", and joining from the
 * assignment side is what makes that absence visible - the tasks with no row
 * here are exactly the unassigned ones.
 */
async function loadAssignments(
	projectId: string,
): Promise<{ taskId: string; name: string }[]> {
	const rows = await db
		.select({
			taskId: taskAssignees.taskId,
			firstName: users.firstName,
			lastName: users.lastName,
			email: users.email,
		})
		.from(taskAssignees)
		.innerJoin(tasks, eq(taskAssignees.taskId, tasks.id))
		.innerJoin(users, eq(taskAssignees.userId, users.id))
		.where(
			and(
				eq(tasks.projectId, projectId),
				isNull(tasks.deletedAt),
				isNull(taskAssignees.deletedAt),
			),
		);

	return rows.map((row) => ({
		taskId: row.taskId,
		name:
			[row.firstName, row.lastName].filter(Boolean).join(" ") ||
			row.email.split("@")[0],
	}));
}

/**
 * Groups tasks into columns, each column split into status buckets.
 *
 * `toGroups` returns a list rather than a single key because a task can belong
 * to several columns at once: one task with two assignees is real work for both
 * of them and has to appear in both. Priority and bucket always return exactly
 * one, so the same helper serves all three.
 *
 * `order` fixes the column sequence. Without it the columns would appear in
 * whatever order the rows arrived, so a priority with no tasks today would shift
 * every other column along - and a chart whose axis moves between page loads is
 * one nobody trusts.
 */
function toStackedGroups(
	taskRows: ProjectTaskRow[],
	toGroups: (task: ProjectTaskRow) => string[],
	order?: readonly string[],
): StackedGroupDTO[] {
	const groups = new Map<string, StackedGroupDTO>();

	const ensure = (name: string): StackedGroupDTO => {
		const existing = groups.get(name);
		if (existing) return existing;

		const created: StackedGroupDTO = {
			name,
			total: 0,
			segments: { notStarted: 0, inProgress: 0, overdue: 0, completed: 0 },
		};
		groups.set(name, created);
		return created;
	};

	if (order) for (const name of order) ensure(name);

	for (const task of taskRows) {
		const bucket = toStatusBucket({
			isCompleted: task.isCompleted,
			status: task.status,
			dueDate: task.dueDate,
			statusOverriddenAt: task.statusOverriddenAt,
		});

		for (const name of toGroups(task)) {
			const group = ensure(name);
			group.segments[bucket] += 1;
			group.total += 1;
		}
	}

	return Array.from(groups.values());
}

/**
 * Every board in the project, in board order - the x-axis of the Bucket panel.
 *
 * Read from the Boards table rather than derived from the tasks, so a column
 * nobody has put anything in yet still appears with a height of zero. Deriving
 * the axis from the data would make an empty board silently vanish, and "we have
 * no Blocked tasks" is a different, more useful statement than "there is no
 * Blocked column".
 */
async function loadBoardOrder(projectId: string): Promise<string[]> {
	const rows = await db
		.select({ name: boards.name })
		.from(boards)
		.where(and(eq(boards.projectId, projectId), isNull(boards.deletedAt)))
		.orderBy(asc(boards.position));

	return rows.map((row) => row.name);
}

export async function getProjectAnalyticsDAL(
	projectId: string,
): Promise<ProjectAnalyticsDTO> {
	const role = await getEffectiveProjectRoleDAL(projectId);
	if (!role) throw new Error("Unauthorized");

	try {
		const [taskRows, assignments, boardOrder] = await Promise.all([
			loadProjectTasks(projectId),
			loadAssignments(projectId),
			loadBoardOrder(projectId),
		]);

		const namesByTask = new Map<string, string[]>();
		for (const assignment of assignments) {
			const existing = namesByTask.get(assignment.taskId) ?? [];
			existing.push(assignment.name);
			namesByTask.set(assignment.taskId, existing);
		}

		// The whole project as a single group, which is exactly what the Status
		// donut needs - so the donut and the three bar charts are counted by the
		// same code and can never disagree about what "Overdue" means.
		const [overall] = toStackedGroups(taskRows, () => ["all"], ["all"]);

		const completedTasks = overall.segments.completed;

		const byMember = toStackedGroups(taskRows, (task) => {
			const names = namesByTask.get(task.id);
			return names && names.length > 0 ? names : [UNASSIGNED_LABEL];
		})
			.sort((a, b) => b.total - a.total)
			// Unassigned is pushed last regardless of size: it is not a person, and
			// letting it sort into the middle of a list of names reads as one.
			.sort((a, b) =>
				a.name === UNASSIGNED_LABEL ? 1 : b.name === UNASSIGNED_LABEL ? -1 : 0,
			);

		return {
			totalTasks: taskRows.length,
			completedTasks,
			tasksLeft: taskRows.length - completedTasks,
			statusTotals: overall.segments,
			byPriority: toStackedGroups(
				taskRows,
				(task) => [task.priority],
				PRIORITY_COLUMN_ORDER,
			),
			byBucket: toStackedGroups(
				taskRows,
				(task) => [task.boardName],
				boardOrder,
			),
			byMember,
		};
	} catch (error) {
		throw new Error("Failed to fetch project analytics", { cause: error });
	}
}
