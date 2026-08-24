import type { z } from "zod";
import type { users } from "@/lib/db/schema";
import type {
	changePasswordSchema,
	userSchema,
} from "@/lib/validations/user-schema";

// DATABASE SCHEMA TYPES
export type DbUser = typeof users.$inferSelect;
export type NewDbUser = typeof users.$inferInsert;

// ZOD VALIDATION TYPES
export type UserInputDTO = z.infer<typeof userSchema>;
export type ChangePasswordDTO = z.infer<typeof changePasswordSchema>;

/**
 * session user - defines a minimal subset of user fields required for almost
 * every authenticated request, ensuring consistency between standard lookup
 * and outage fallbacks.
 */
export interface SessionUser {
	id: string;
	clerkId: string;
	email: string;
	firstName: string | null;
	lastName: string | null;
	imageUrl: string | null;
}
