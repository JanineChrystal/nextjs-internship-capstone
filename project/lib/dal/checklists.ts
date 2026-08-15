import "server-only";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { checklists, tasks } from "@/lib/db/schema";
import { type ChecklistOutputDTO, toChecklistDTO } from "@/lib/dtos/task-dto";

export async function getChecklistItemsByTaskIds(
	taskIds: string[],
): Promise<Map<string, ChecklistOutputDTO[]>> {
	const itemsByTask = new Map<string, ChecklistOutputDTO[]>();
	if (taskIds.length === 0) return itemsByTask;

	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const results = await db
			.select()
			.from(checklists)
			.where(
				and(inArray(checklists.taskId, taskIds), isNull(checklists.deletedAt)),
			);

		for (const item of results) {
			const list = itemsByTask.get(item.taskId) ?? [];
			list.push(toChecklistDTO(item));
			itemsByTask.set(item.taskId, list);
		}

		return itemsByTask;
	} catch (error) {
		throw new Error("Failed to fetch checklist items from database", {
			cause: error,
		});
	}
}

async function verifyTaskInProject(
	taskId: string,
	projectId: string,
): Promise<void> {
	const [task] = await db
		.select({ id: tasks.id })
		.from(tasks)
		.where(
			and(
				eq(tasks.id, taskId),
				eq(tasks.projectId, projectId),
				isNull(tasks.deletedAt),
			),
		);
	if (!task) throw new Error("Task not found");
}

export async function createChecklistItemInDB(
	taskId: string,
	projectId: string,
	title: string,
): Promise<ChecklistOutputDTO> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		await verifyTaskInProject(taskId, projectId);

		const [item] = await db
			.insert(checklists)
			.values({ taskId, title })
			.returning();

		return toChecklistDTO(item);
	} catch (error) {
		throw new Error("Failed to create checklist item in database", {
			cause: error,
		});
	}
}

function tasksInProjectSubquery(projectId: string) {
	return db
		.select({ id: tasks.id })
		.from(tasks)
		.where(and(eq(tasks.projectId, projectId), isNull(tasks.deletedAt)));
}

export async function updateChecklistItemInDB(
	itemId: string,
	projectId: string,
	data: { title?: string; isCompleted?: boolean },
): Promise<ChecklistOutputDTO> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const result = await db
			.update(checklists)
			.set({ ...data, updatedAt: new Date() })
			.where(
				and(
					eq(checklists.id, itemId),
					inArray(checklists.taskId, tasksInProjectSubquery(projectId)),
					isNull(checklists.deletedAt),
				),
			)
			.returning();

		if (result.length === 0) throw new Error("Checklist item not found");

		return toChecklistDTO(result[0]);
	} catch (error) {
		throw new Error("Failed to update checklist item in database", {
			cause: error,
		});
	}
}

export async function deleteChecklistItemInDB(
	itemId: string,
	projectId: string,
): Promise<void> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		await db
			.update(checklists)
			.set({ deletedAt: new Date(), updatedAt: new Date() })
			.where(
				and(
					eq(checklists.id, itemId),
					inArray(checklists.taskId, tasksInProjectSubquery(projectId)),
					isNull(checklists.deletedAt),
				),
			);
	} catch (error) {
		throw new Error("Failed to delete checklist item in database", {
			cause: error,
		});
	}
}
