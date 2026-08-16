import type {
	Assignee,
	DbAttachment,
	DbChecklist,
	DbTask,
	GridTask,
} from "@/lib/types/task";
import { deriveTaskStatus, isTaskOverdue } from "@/lib/utils/task-status";

export interface TaskOutputDTO {
	id: string;
	projectId: string;
	boardId: string;
	position: number;
	name: string;
	category: string | null;
	isCompleted: boolean;
	status: string;
	statusOverriddenAt: Date | null;
	previousBoardId: string | null;
	priority: string;
	startDate: Date | null;
	dueDate: Date | null;
	notes: string | null;
	createdAt: Date;
	updatedAt: Date;
}

// Strips characters that would let stored text inject markup when rendered as-is.
function sanitizeText<T extends string | null>(value: T): T {
	if (value === null) return value;
	return value.replace(/[<>]/g, "") as T;
}

export function toTaskDTO(task: DbTask): TaskOutputDTO {
	return {
		id: task.id,
		projectId: task.projectId,
		boardId: task.boardId,
		position: task.position,
		name: sanitizeText(task.name),
		category: sanitizeText(task.category),
		isCompleted: task.isCompleted,
		status: task.status,
		statusOverriddenAt: task.statusOverriddenAt,
		previousBoardId: task.previousBoardId,
		priority: task.priority,
		startDate: task.startDate,
		dueDate: task.dueDate,
		notes: sanitizeText(task.notes),
		createdAt: task.createdAt,
		updatedAt: task.updatedAt,
	};
}

function toTaskDateInputValue(date: Date | null): string {
	return date ? date.toISOString() : "--";
}

export function toTaskUI(
	dto: TaskOutputDTO,
	boardTitle: string,
	assignees: Assignee[],
	checklist: ChecklistOutputDTO[],
	attachments: AttachmentOutputDTO[],
): GridTask {
	return {
		id: dto.id,
		projectId: dto.projectId,
		name: dto.name,
		notes: dto.notes ?? "",
		category: dto.category ?? undefined,
		assignees,
		startDate: toTaskDateInputValue(dto.startDate),
		dueDate: toTaskDateInputValue(dto.dueDate),
		board: boardTitle,
		status: deriveTaskStatus({
			isCompleted: dto.isCompleted,
			status: dto.status,
			dueDate: dto.dueDate,
			statusOverriddenAt: dto.statusOverriddenAt,
		}),
		storedStatus: dto.status,
		isOverdue: isTaskOverdue({
			isCompleted: dto.isCompleted,
			dueDate: dto.dueDate,
		}),
		previousBoardId: dto.previousBoardId,
		priority: dto.priority as GridTask["priority"],
		isCompleted: dto.isCompleted,
		checklist: checklist.map((item) => ({
			id: item.id,
			title: item.title,
			completed: item.isCompleted,
		})),
		attachments: attachments.map((item) => ({
			id: item.id,
			name: item.name,
			url: item.url,
		})),
		links: [],
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
