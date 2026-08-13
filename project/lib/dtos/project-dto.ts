import type { DbProject } from "@/lib/types/project";

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
