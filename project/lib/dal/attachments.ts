import "server-only";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { attachments, tasks } from "@/lib/db/schema";
import { type AttachmentOutputDTO, toAttachmentDTO } from "@/lib/dtos/task-dto";

function tasksInProjectSubquery(projectId: string) {
	return db
		.select({ id: tasks.id })
		.from(tasks)
		.where(and(eq(tasks.projectId, projectId), isNull(tasks.deletedAt)));
}

export async function getAttachmentsByTaskIds(
	taskIds: string[],
): Promise<Map<string, AttachmentOutputDTO[]>> {
	const attachmentsByTask = new Map<string, AttachmentOutputDTO[]>();
	if (taskIds.length === 0) return attachmentsByTask;

	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		const results = await db
			.select()
			.from(attachments)
			.where(
				and(
					inArray(attachments.taskId, taskIds),
					isNull(attachments.deletedAt),
				),
			);

		for (const item of results) {
			const list = attachmentsByTask.get(item.taskId) ?? [];
			list.push(toAttachmentDTO(item));
			attachmentsByTask.set(item.taskId, list);
		}

		return attachmentsByTask;
	} catch (error) {
		throw new Error("Failed to fetch attachments from database", {
			cause: error,
		});
	}
}

export async function createAttachmentInDB(
	taskId: string,
	projectId: string,
	data: { name: string; url: string; type: "file" | "link" },
): Promise<AttachmentOutputDTO> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
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

		const [attachment] = await db
			.insert(attachments)
			.values({ taskId, ...data })
			.returning();

		return toAttachmentDTO(attachment);
	} catch (error) {
		throw new Error("Failed to create attachment in database", {
			cause: error,
		});
	}
}

export async function deleteAttachmentInDB(
	attachmentId: string,
	projectId: string,
): Promise<void> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	try {
		await db
			.update(attachments)
			.set({ deletedAt: new Date(), updatedAt: new Date() })
			.where(
				and(
					eq(attachments.id, attachmentId),
					inArray(attachments.taskId, tasksInProjectSubquery(projectId)),
					isNull(attachments.deletedAt),
				),
			);
	} catch (error) {
		throw new Error("Failed to delete attachment in database", {
			cause: error,
		});
	}
}
