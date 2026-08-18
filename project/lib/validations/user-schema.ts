import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "@/lib/db/schema";

// DATABASE SCHEMA VALIDATION
export const insertUserDbSchema = createInsertSchema(users);
export const selectUserDbSchema = createSelectSchema(users);

// UI VALIDATION SCHEMAS
export const userSchema = z.object({
	email: z
		.string()
		.min(1, "Email is required")
		.regex(
			/^[a-zA-Z0-9._%+-]+@gmail\.com$/,
			"Only @gmail.com email addresses are allowed",
		),
	password: z.string().min(8),
});

export const changePasswordSchema = z
	.object({
		currentPassword: z.string().min(1, "Current password is required"),
		newPassword: z
			.string()
			.min(8, "Password must be at least 8 characters")
			.regex(/[A-Z]/, "Must contain at least one uppercase letter")
			.regex(/[a-z]/, "Must contain at least one lowercase letter")
			.regex(/[0-9]/, "Must contain at least one number")
			.regex(/[^a-zA-Z0-9]/, "Must contain at least one special character"),
		confirmPassword: z.string().min(1, "Password confirmation is required"),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});
