import type { z } from "zod";
import type { projectTeams, teamMembers, teams } from "@/lib/db/schema";
import type {
	CreateTeamSchema,
	UpdateTeamSchema,
} from "@/lib/validations/team-schema";

// DATABASE SCHEMA TYPES
export type DbTeam = typeof teams.$inferSelect;
export type NewDbTeam = typeof teams.$inferInsert;

export type DbTeamMember = typeof teamMembers.$inferSelect;
export type NewDbTeamMember = typeof teamMembers.$inferInsert;

export type DbProjectTeam = typeof projectTeams.$inferSelect;
export type NewDbProjectTeam = typeof projectTeams.$inferInsert;

// INPUT TYPES
export type CreateTeamInput = z.infer<typeof CreateTeamSchema>;
export type UpdateTeamInput = z.infer<typeof UpdateTeamSchema>;

// UI TYPES
/**
 * team view type - defines the allowed views on the team directory page,
 * placed centrally to prevent reverse dependency imports from the toolbar.
 */
export type TeamViewType = "Grid" | "Board" | "Pending";
