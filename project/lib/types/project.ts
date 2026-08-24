import type { z } from "zod";
import type { projects } from "@/lib/db/schema";
import type {
	createProjectSchema,
	editProjectSchema,
	ProjectCategorySchema,
} from "@/lib/validations/project-schema";

// DATABASE SCHEMA TYPES
export type DbProject = typeof projects.$inferSelect;
export type NewDbProject = typeof projects.$inferInsert;

// ZOD VALIDATION TYPES
export type CreateProjectInputDTO = z.infer<typeof createProjectSchema>;
export type EditProjectInputDTO = z.infer<typeof editProjectSchema>;
export type ProjectCategory = z.infer<typeof ProjectCategorySchema>;

// UI / DOMAIN TYPES
export interface DangerZoneActionConfig {
	id: "archive" | "delete";
	title: string;
	description: string;
	isDestructive?: boolean;
}

/**
 * project stats - aggregated per-project metrics backing project cards,
 * declared outside the DAL to strictly prevent client-side components from
 * reaching into server-only modules.
 */
export interface ProjectStats {
	taskCount: number;
	completedTaskCount: number;
	memberCount: number;
}

/**
 * project view type - defines the allowed view states for a project detail
 * page, serving as the single source of truth across client components and
 * constants.
 */
export type ProjectViewType =
	| "grid"
	| "board"
	| "calendar"
	| "charts"
	| "settings";
