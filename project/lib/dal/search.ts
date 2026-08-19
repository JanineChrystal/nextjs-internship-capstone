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
 * Global search across projects, tasks and people.
 *
 * ## Why ILIKE and not Postgres full-text search
 *
 * Full-text search is the textbook answer: it ranks results, uses a GIN index,
 * and understands that "running" and "ran" are the same word. It is not the
 * right answer here, for three reasons.
 *
 * It matches whole words from their start, so typing "kanb" would find nothing
 * until "kanban" is complete - which is exactly the behaviour a
 * search-as-you-type box must not have. Its stemming is language-specific, and
 * this app's content is a mix of English and Filipino, so English stemming would
 * be wrong about half of it. And it needs a generated column plus an index,
 * which is a migration for a dataset currently in the hundreds of rows.
 *
 * `ILIKE '%term%'` matches anywhere in the string, needs no migration, and is
 * honest about what it is: substring matching, not relevance ranking. The cost
 * is a sequential scan - fine at this size, and fixable without changing this
 * function by adding a pg_trgm GIN index when it stops being fine. That is the
 * trade-off, and it is worth being able to state.
 *
 * ## Scoping
 *
 * Everything resolves through getAllUserProjectsDAL(), the same route analytics
 * and the archive use. A shared project lives in its owner's workspace, so
 * scoping by workspace id would let an invited member search their own projects
 * and find nothing.
 */

/**
 * Escapes the characters that mean something inside a LIKE pattern.
 *
 * Without this, searching for "50%" matches every row - `%` is the wildcard, so
 * the pattern becomes "%50%%" and the trailing wildcard swallows everything.
 * `_` is the single-character wildcard and has the same problem, and the escape
 * character itself has to be escaped first or it would escape the escapes we are
 * about to add.
 *
 * This is not an injection defence - the value is still passed as a bound
 * parameter, never concatenated into SQL. It is a correctness fix: without it,
 * perfectly ordinary search terms silently return the wrong rows.
 */
function toLikePattern(term: string): string {
	const escaped = term
		.replace(/\\/g, "\\\\")
		.replace(/%/g, "\\%")
		.replace(/_/g, "\\_");

	return `%${escaped}%`;
}

/**
 * `ILIKE` with an explicit ESCAPE clause.
 *
 * Drizzle's `ilike` helper does not emit an ESCAPE clause, so the backslashes
 * added above would be treated as literal characters rather than escapes.
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

		// One extra row per group, so "there is more" is known without a second
		// COUNT over the same predicate - the same limit + 1 trick the comments
		// and notifications queries already use.
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

			// Archived and trashed tasks are excluded for the same reason they are
			// everywhere else: they have been taken out of play, and surfacing one
			// here would offer a result that the board it links to will not show.
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

			// People you actually share a project with. Searching every user in the
			// database would turn the box into a directory of strangers, and would
			// leak that an address has an account here.
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
						// You already know who you are.
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
