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
 * column action config - defines the shape of a board column dropdown menu
 * item, placed with board types to decouple item structure from the kanban
 * constants file that holds the menu configuration itself.
 */
export interface ColumnActionConfig {
	id: "rename" | "delete" | "set-completion";
	label: string;
	icon: LucideIcon;
	variant?: "danger" | "default";
}
