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
 * project analytics - generates data for the four project chart panels,
 * utilizing a shared grouping helper to efficiently aggregate task statuses
 * across different dimensions. Strictly gated by project role.
 */

/** project task row - consolidates all fields required by the four analytics panels into a single type. */
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
		.where(
			and(
				eq(tasks.projectId, projectId),
				isNull(tasks.archivedAt),
				isNull(tasks.deletedAt),
			),
		)
		.orderBy(asc(boards.position));
}

/**
 * load assignments - retrieves task assignments via an inner join to
 * explicitly distinguish assigned tasks, allowing callers to accurately
 * bucket tasks missing from this list as 'Unassigned'.
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
 * to stacked groups - aggregates tasks into predefined or derived columns,
 * splitting each into status buckets. Supports multi-column assignment
 * (e.g., multiple assignees) and enforces fixed column ordering for chart
 * stability.
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
 * load board order - fetches all boards to establish the exact x-axis
 * for the Bucket panel, ensuring empty boards are visibly represented
 * with zero height rather than vanishing entirely.
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

		/**
		 * aggregate overall status - groups all tasks into a single bucket
		 * using the shared counting logic, guaranteeing consistency between
		 * the overall donut chart and individual bar charts.
		 */
		const [overall] = toStackedGroups(taskRows, () => ["all"], ["all"]);

		const completedTasks = overall.segments.completed;

		const byMember = toStackedGroups(taskRows, (task) => {
			const names = namesByTask.get(task.id);
			return names && names.length > 0 ? names : [UNASSIGNED_LABEL];
		})
			.sort((a, b) => b.total - a.total)
			/** pin unassigned last - sorts 'Unassigned' to the end to prevent it from mingling with actual names. */
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
