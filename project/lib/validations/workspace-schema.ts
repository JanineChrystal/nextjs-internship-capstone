import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { workspaces } from "@/lib/db/schema";

//DATABASE SCHEMA VALIDATION
export const insertWorkspaceDbSchema = createInsertSchema(workspaces);
export const selectWorkspaceDbSchema = createSelectSchema(workspaces);
