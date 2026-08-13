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
