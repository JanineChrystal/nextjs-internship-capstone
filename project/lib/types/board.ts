import type { LucideIcon } from "lucide-react";
import type { z } from "zod";
import type { boards } from "@/lib/db/schema";
import type { BoardColumnSchema } from "@/lib/validations/board-schema";

//DATABASE SCHEMA TYPES
export type DbBoard = typeof boards.$inferSelect;
export type NewDbBoard = typeof boards.$inferInsert;

// UI VALIDATION TYPES
export type BoardColumn = z.infer<typeof BoardColumnSchema>;

/**
 * One entry in a board column's dropdown menu. Kept with the other board types
 * rather than in the kanban constants file, which should hold the menu itself
 * and not the shape of a menu item.
 */
export interface ColumnActionConfig {
	id: "rename" | "delete" | "set-completion";
	label: string;
	icon: LucideIcon;
	variant?: "danger" | "default";
}
