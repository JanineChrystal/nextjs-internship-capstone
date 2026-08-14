import type { DbProject } from "@/lib/types/project";
import type { Project } from "@/lib/validations/project-schema";

export interface ProjectOutputDTO {
	id: string;
	workspaceId: string;
	ownerId: string;
	name: string;
	description: string | null;
	status: string;
	priority: string;
	category: string | null;
	startDate: Date | null;
	dueDate: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

export function toProjectDTO(project: DbProject): ProjectOutputDTO {
	return {
		id: project.id,
		workspaceId: project.workspaceId,
		ownerId: project.ownerId,
		name: project.name,
		description: project.description,
		status: project.status,
		priority: project.priority,
		category: project.category,
		startDate: project.startDate,
		dueDate: project.dueDate,
		createdAt: project.createdAt,
		updatedAt: project.updatedAt,
	};
}

export function toProjectUI(
	dto: ProjectOutputDTO,
	currentUserId?: string,
): Project {
	const validStatuses: Array<"active" | "completed" | "overdue" | "archived"> =
		["active", "completed", "overdue", "archived"];
	const validPriorities: Array<"low" | "medium" | "high" | "urgent"> = [
		"low",
		"medium",
		"high",
		"urgent",
	];

	const normalizedStatus = validStatuses.includes(
		dto.status as "active" | "completed" | "overdue" | "archived",
	)
		? (dto.status as "active" | "completed" | "overdue" | "archived")
		: "active";

	const normalizedPriority = validPriorities.includes(
		dto.priority as "low" | "medium" | "high" | "urgent",
	)
		? (dto.priority as "low" | "medium" | "high" | "urgent")
		: "low";

	const daysLeft = dto.dueDate
		? Math.max(
				0,
				Math.ceil((dto.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
			)
		: 0;

	return {
		id: dto.id,
		title: dto.name,
		description: dto.description || undefined,
		category: dto.category || undefined,
		startDate: dto.startDate
			? dto.startDate.toISOString().slice(0, 16)
			: undefined,
		dueDate: dto.dueDate ? dto.dueDate.toISOString().slice(0, 16) : undefined,
		status: normalizedStatus,
		priority: normalizedPriority,
		daysLeft,
		membersCount: 1,
		tasksCount: 0,
		progress: 0,
		isOwned: currentUserId ? dto.ownerId === currentUserId : true,
		isAssigned: false,
	};
}
