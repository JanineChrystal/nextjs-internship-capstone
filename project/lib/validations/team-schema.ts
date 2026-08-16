import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { projectTeams, teamMembers, teams } from "@/lib/db/schema";

// DATABASE SCHEMA VALIDATION
export const insertTeamDbSchema = createInsertSchema(teams);
export const selectTeamDbSchema = createSelectSchema(teams);

export const insertTeamMemberDbSchema = createInsertSchema(teamMembers);
export const selectTeamMemberDbSchema = createSelectSchema(teamMembers);

export const insertProjectTeamDbSchema = createInsertSchema(projectTeams);
export const selectProjectTeamDbSchema = createSelectSchema(projectTeams);

// UI VALIDATION SCHEMAS
export const TeamNameSchema = z
	.string()
	.trim()
	.min(1, "Team name is required")
	.max(80, "Team name must be 80 characters or fewer");

export const TeamDescriptionSchema = z
	.string()
	.trim()
	.max(500, "Description must be 500 characters or fewer")
	.optional();

export const CreateTeamSchema = z.object({
	name: TeamNameSchema,
	description: TeamDescriptionSchema,
	userIds: z
		.array(z.uuid("Invalid user id"))
		.default([])
		.transform((ids) => Array.from(new Set(ids))),
});

export const UpdateTeamSchema = z.object({
	name: TeamNameSchema.optional(),
	description: TeamDescriptionSchema,
});
