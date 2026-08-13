import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { boards } from "@/lib/db/schema";

// DATABASE SCHEMA VALIDATION (Generated from Drizzle)
export const insertBoardDbSchema = createInsertSchema(boards);
export const selectBoardDbSchema = createSelectSchema(boards);

// UI VALIDATION SCHEMAS
export const BoardColumnSchema = z.object({
	id: z.string(),
	title: z.string().min(1, "Column title is required"),
	dotColor: z.string(),
	order: z.number().int(),
});
