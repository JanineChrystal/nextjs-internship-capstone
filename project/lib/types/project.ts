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
 * Aggregated per-project counts backing the project cards.
 *
 * Kept here rather than beside the query that builds it: the card components
 * that consume it are client-side and must never reach into the DAL, which is
 * `server-only`.
 */
export interface ProjectStats {
	taskCount: number;
	completedTaskCount: number;
	memberCount: number;
}

/**
 * The five views on a project detail page.
 *
 * This existed twice, declared identically in project-detail-client.tsx and in
 * _constants/project.ts, with different files importing different copies. They
 * happened to agree; nothing made them.
 */
export type ProjectViewType =
	| "grid"
	| "board"
	| "calendar"
	| "charts"
	| "settings";
