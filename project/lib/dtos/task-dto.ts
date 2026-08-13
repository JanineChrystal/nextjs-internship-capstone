import type { DbAttachment, DbChecklist, DbTask } from "@/lib/types/task";

export interface TaskOutputDTO {
	id: string;
	projectId: string;
	boardId: string;
	name: string;
	category: string | null;
	status: string;
	priority: string;
	startDate: Date | null;
	dueDate: Date | null;
	notes: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export function toTaskDTO(task: DbTask): TaskOutputDTO {
	return {
		id: task.id,
		projectId: task.projectId,
		boardId: task.boardId,
		name: task.name,
		category: task.category,
		status: task.status,
		priority: task.priority,
		startDate: task.startDate,
		dueDate: task.dueDate,
		notes: task.notes,
		createdAt: task.createdAt,
		updatedAt: task.updatedAt,
	};
}

export interface ChecklistOutputDTO {
	id: string;
	taskId: string;
	title: string;
	isCompleted: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export function toChecklistDTO(checklist: DbChecklist): ChecklistOutputDTO {
	return {
		id: checklist.id,
		taskId: checklist.taskId,
		title: checklist.title,
		isCompleted: checklist.isCompleted,
		createdAt: checklist.createdAt,
		updatedAt: checklist.updatedAt,
	};
}

export interface AttachmentOutputDTO {
	id: string;
	taskId: string;
	name: string;
	url: string;
	type: string;
	createdAt: Date;
	updatedAt: Date;
}

export function toAttachmentDTO(attachment: DbAttachment): AttachmentOutputDTO {
	return {
		id: attachment.id,
		taskId: attachment.taskId,
		name: attachment.name,
		url: attachment.url,
		type: attachment.type,
		createdAt: attachment.createdAt,
		updatedAt: attachment.updatedAt,
	};
}
