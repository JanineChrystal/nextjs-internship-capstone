import type { z } from "zod";
import type { users } from "@/lib/db/schema";
import type {
	changePasswordSchema,
	userSchema,
} from "@/lib/validations/user-schema";

// 1. DATABASE SCHEMA TYPES (Inferred automatically from Drizzle)
export type DbUser = typeof users.$inferSelect;
export type NewDbUser = typeof users.$inferInsert;

// 2. ZOD VALIDATION TYPES (Inferred automatically from Zod)
export type UserInputDTO = z.infer<typeof userSchema>;
export type ChangePasswordDTO = z.infer<typeof changePasswordSchema>;
