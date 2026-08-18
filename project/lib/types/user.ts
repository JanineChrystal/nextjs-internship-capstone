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
 * The user fields every authenticated request needs.
 *
 * Narrower than DbUser on purpose - a session lookup runs on nearly every
 * request, so it selects only what callers actually read. Shared by
 * getCurrentUser and the webhook-outage fallback so the two can never return
 * differently shaped objects.
 */
export interface SessionUser {
	id: string;
	clerkId: string;
	email: string;
	firstName: string | null;
	lastName: string | null;
	imageUrl: string | null;
}
