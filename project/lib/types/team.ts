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
 * The three views on the team directory page. Kept here rather than in
 * team-toolbar.tsx because the constants file and the selection hook both need
 * it, and neither should have to reach into a component to get it.
 */
export type TeamViewType = "Grid" | "Board" | "Pending";
