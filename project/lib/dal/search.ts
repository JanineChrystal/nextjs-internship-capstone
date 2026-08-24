import "server-only";
import { and, desc, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { SEARCH_GROUP_LIMIT } from "@/lib/constants/search";
import { getCurrentUser } from "@/lib/dal/auth";
import { getAllUserProjectsDAL } from "@/lib/dal/projects";
import { db } from "@/lib/db";
import { projectMembers, projects, tasks, users } from "@/lib/db/schema";
import {
	toPersonSearchResult,
	toProjectSearchResult,
	toTaskSearchResult,
} from "@/lib/dtos/search-dto";
import type { SearchResults } from "@/lib/types/search";

/**
 * global search - searches across projects, tasks, and people using ILIKE
 * for immediate substring matching without language-specific stemming.
 * Scoped precisely to the user's accessible projects rather than workspace
 * to ensure shared items are discoverable.
 */

/**
 * to like pattern - escapes special LIKE characters (%, _, \) to ensure
 * literal substring matching, preventing wildcards from silently swallowing
 * or mangling search terms.
 */
function toLikePattern(term: string): string {
	const escaped = term
		.replace(/\\/g, "\\\\")
		.replace(/%/g, "\\%")
		.replace(/_/g, "\\_");

	return `%${escaped}%`;
}

/**
 * matches helper - constructs an ILIKE condition with an explicit ESCAPE
 * clause since Drizzle's built-in ilike omits it.
 */
function matches(column: unknown, pattern: string) {
	return sql`${column} ILIKE ${pattern} ESCAPE '\\'`;
}

export async function globalSearchDAL(term: string): Promise<SearchResults> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");

	const empty: SearchResults = {
		projects: [],
		tasks: [],
		people: [],
		hasMore: false,
	};

	try {
		const accessible = await getAllUserProjectsDAL();
		if (accessible.length === 0) return empty;

		const projectIds = accessible.map((project) => project.id);
		const pattern = toLikePattern(term);

		/** limit plus one - fetches one extra row to cheaply determine if more results exist without a COUNT query. */
		const limit = SEARCH_GROUP_LIMIT + 1;

		const [projectRows, taskRows, peopleRows] = await Promise.all([
			db
				.select({
					id: projects.id,
					name: projects.name,
					category: projects.category,
				})
				.from(projects)
				.where(
					and(
						inArray(projects.id, projectIds),
						or(
							matches(projects.name, pattern),
							matches(projects.description, pattern),
							matches(projects.category, pattern),
						),
					),
				)
				.orderBy(desc(projects.updatedAt))
				.limit(limit),

			/** filter inactive tasks - excludes archived and trashed tasks so search results do not lead to empty boards. */
			db
				.select({
					id: tasks.id,
					name: tasks.name,
					projectId: tasks.projectId,
					projectName: projects.name,
				})
				.from(tasks)
				.innerJoin(projects, sql`${tasks.projectId} = ${projects.id}`)
				.where(
					and(
						inArray(tasks.projectId, projectIds),
						isNull(tasks.archivedAt),
						isNull(tasks.deletedAt),
						or(matches(tasks.name, pattern), matches(tasks.notes, pattern)),
					),
				)
				.orderBy(desc(tasks.updatedAt))
				.limit(limit),

			/** scope people search - restricts people search to shared project members to prevent leaking the global user directory. */
			db
				.selectDistinct({
					id: users.id,
					firstName: users.firstName,
					lastName: users.lastName,
					email: users.email,
				})
				.from(users)
				.innerJoin(projectMembers, sql`${projectMembers.userId} = ${users.id}`)
				.where(
					and(
						inArray(projectMembers.projectId, projectIds),
						isNull(projectMembers.deletedAt),
						isNull(users.deletedAt),
						/** exclude self - removes the searching user from the people results. */
						ne(users.id, user.id),
						or(
							matches(users.firstName, pattern),
							matches(users.lastName, pattern),
							matches(users.email, pattern),
						),
					),
				)
				.limit(limit),
		]);

		const hasMore =
			projectRows.length > SEARCH_GROUP_LIMIT ||
			taskRows.length > SEARCH_GROUP_LIMIT ||
			peopleRows.length > SEARCH_GROUP_LIMIT;

		return {
			projects: projectRows
				.slice(0, SEARCH_GROUP_LIMIT)
				.map(toProjectSearchResult),
			tasks: taskRows.slice(0, SEARCH_GROUP_LIMIT).map(toTaskSearchResult),
			people: peopleRows.slice(0, SEARCH_GROUP_LIMIT).map(toPersonSearchResult),
			hasMore,
		};
	} catch (error) {
		throw new Error("Failed to run search", { cause: error });
	}
}
