import type { z } from "zod";
import type { projects } from "@/lib/db/schema";
import type {
	createProjectSchema,
	editProjectSchema,
} from "@/lib/validations/project-schema";

// 1. DATABASE SCHEMA TYPES (Inferred automatically from Drizzle)
export type DbProject = typeof projects.$inferSelect;
export type NewDbProject = typeof projects.$inferInsert;

// 2. ZOD VALIDATION TYPES (Inferred automatically from Zod)
export type CreateProjectInputDTO = z.infer<typeof createProjectSchema>;
export type EditProjectInputDTO = z.infer<typeof editProjectSchema>;

// 3. UI / DOMAIN TYPES (Composed for UI Components)
export interface DangerZoneActionConfig {
	id: "archive" | "delete";
	title: string;
	description: string;
	isDestructive?: boolean;
}
