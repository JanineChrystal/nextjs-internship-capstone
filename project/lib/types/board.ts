import type { z } from "zod";
import type { boards } from "@/lib/db/schema";
import type { BoardColumnSchema } from "@/lib/validations/board-schema";

//DATABASE SCHEMA TYPES
export type DbBoard = typeof boards.$inferSelect;
export type NewDbBoard = typeof boards.$inferInsert;

// UI VALIDATION TYPES
export type BoardColumn = z.infer<typeof BoardColumnSchema>;
