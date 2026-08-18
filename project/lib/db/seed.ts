import { and, eq, isNull, like } from "drizzle-orm";
import { db } from "./index";
import {
	activityLogs,
	boards,
	projectMembers,
	projects,
	taskAssignees,
	tasks,
	users,
	workspaces,
} from "./schema";

/**
 * Demo data for the analytics surfaces.
 *
 * Run with: pnpm db:seed
 * Optionally: SEED_USER_EMAIL=you@example.com pnpm db:seed
 *
 * ---------------------------------------------------------------------------
 * Why a seed script exists at all
 * ---------------------------------------------------------------------------
 * Analytics is the one feature that cannot be checked by using the app for five
 * minutes. Velocity is measured over four weeks and the trend chart plots a
 * fortnight, so a freshly-created task tells you almost nothing: every chart
 * shows a single spike on today's date and every average is either 0 or the one
 * value you just produced. Seeding backdated history is the only way to see
 * whether the maths is right before a demo, rather than during one.
 *
 * ---------------------------------------------------------------------------
 * Three properties this script deliberately has
 * ---------------------------------------------------------------------------
 * 1. IDEMPOTENT. Every project it creates is named with a fixed prefix, and the
 *    first thing it does is delete the projects carrying that prefix. Running it
 *    five times leaves the same database as running it once. Without that, a
 *    second run would double every number on the dashboard and the charts would
 *    look wrong for a reason that had nothing to do with the code.
 *
 * 2. NON-DESTRUCTIVE to real data. It never truncates a table and never touches
 *    a project it did not create. A seed script that starts with DELETE FROM is
 *    one mistyped environment variable away from wiping the production branch.
 *
 * 3. DETERMINISTIC. The randomness is a seeded generator, so the same run
 *    produces the same charts every time. A demo that looks different on every
 *    reload is impossible to talk about.
 */

const DEMO_PREFIX = "[Demo]";

/** Everything is generated inside this window so the 28-day metrics have shape. */
const HISTORY_DAYS = 30;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * A small deterministic pseudo-random generator (mulberry32).
 *
 * Math.random() would make every run produce a different chart, which defeats
 * the point: the seed data is meant to be something you can describe once and
 * then recognise every time you look at it.
 */
function createRandom(seed: number) {
	let state = seed;
	return function random(): number {
		state |= 0;
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const random = createRandom(20260818);

function pick<T>(items: readonly T[]): T {
	return items[Math.floor(random() * items.length)];
}

function daysAgo(days: number, hour = 10): Date {
	const date = new Date(Date.now() - days * MILLISECONDS_PER_DAY);
	date.setHours(hour, Math.floor(random() * 60), 0, 0);
	return date;
}

interface DemoProjectSpec {
	name: string;
	description: string;
	category: string;
	taskCount: number;
	/** Roughly what share of this project's tasks should be finished. */
	completionRate: number;
}

/**
 * Four projects at deliberately different stages, so the Project Progress chart
 * has something to rank. A set of projects all sitting at 50% would draw four
 * identical bars and prove nothing about the sort order or the axis.
 */
const DEMO_PROJECTS: DemoProjectSpec[] = [
	{
		name: `${DEMO_PREFIX} Website Redesign`,
		description: "Marketing site refresh, from wireframes through launch.",
		category: "Design",
		taskCount: 18,
		completionRate: 0.78,
	},
	{
		name: `${DEMO_PREFIX} Mobile App v2`,
		description: "Second iteration of the mobile client.",
		category: "Development",
		taskCount: 22,
		completionRate: 0.45,
	},
	{
		name: `${DEMO_PREFIX} Q3 Content Calendar`,
		description: "Blog posts, newsletters and social scheduling.",
		category: "Content",
		taskCount: 12,
		completionRate: 0.92,
	},
	{
		name: `${DEMO_PREFIX} Customer Research`,
		description: "Interview programme and findings write-up.",
		category: "Research",
		taskCount: 9,
		completionRate: 0.11,
	},
];

const BOARD_NAMES = ["Backlog", "In Progress", "Review", "Done"];
const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
const OPEN_STATUSES = ["Not Started", "In Progress"];

const TASK_TITLES = [
	"Draft the information architecture",
	"Audit the existing component library",
	"Write the onboarding copy",
	"Set up the analytics events",
	"Review accessibility contrast",
	"Prepare the stakeholder deck",
	"Fix the responsive navigation",
	"Migrate the legacy assets",
	"Interview three power users",
	"Summarise the survey results",
	"Refactor the settings form",
	"Add empty states to the dashboard",
	"Schedule the launch announcement",
	"Compress the hero imagery",
	"Document the release process",
	"Triage the open bug reports",
	"Plan the next sprint",
	"Update the pricing page",
	"Test the sign-up flow end to end",
	"Collect feedback from the pilot group",
	"Reconcile the design tokens",
	"Write the retrospective notes",
];

async function resolveTargetUser() {
	const wanted = process.env.SEED_USER_EMAIL?.trim().toLowerCase();

	if (wanted) {
		const [found] = await db
			.select()
			.from(users)
			.where(and(eq(users.email, wanted), isNull(users.deletedAt)));

		if (!found) {
			throw new Error(
				`No user with email ${wanted}. Sign in once so the Clerk webhook creates the row, then re-run.`,
			);
		}
		return found;
	}

	const [first] = await db
		.select()
		.from(users)
		.where(isNull(users.deletedAt))
		.limit(1);

	if (!first) {
		throw new Error(
			"No users in this database. Sign up in the app first - the seed attaches its projects to a real account.",
		);
	}
	return first;
}

async function resolveWorkspace(ownerId: string) {
	const [existing] = await db
		.select()
		.from(workspaces)
		.where(and(eq(workspaces.ownerId, ownerId), isNull(workspaces.deletedAt)))
		.limit(1);

	if (existing) return existing;

	const [created] = await db
		.insert(workspaces)
		.values({ ownerId, name: "My Workspace" })
		.returning();

	return created;
}

/**
 * Removes anything a previous run created.
 *
 * A hard delete rather than the soft delete the app uses, because these rows are
 * scaffolding rather than history - leaving them flagged as deleted would keep
 * them in the tables forever and make the next person wonder what they were.
 * Every child row (boards, tasks, assignees, activity, notifications) goes with
 * them through the schema's ON DELETE CASCADE.
 */
async function clearPreviousSeed(workspaceId: string): Promise<number> {
	const removed = await db
		.delete(projects)
		.where(
			and(
				eq(projects.workspaceId, workspaceId),
				like(projects.name, `${DEMO_PREFIX}%`),
			),
		)
		.returning({ id: projects.id });

	return removed.length;
}

/** Other real accounts, so workload and "active people" are not a chart of one. */
async function resolveCollaborators(excludeUserId: string) {
	const others = await db
		.select()
		.from(users)
		.where(isNull(users.deletedAt))
		.limit(4);

	return others
		.filter((candidate) => candidate.id !== excludeUserId)
		.slice(0, 3);
}

async function seedProject(
	spec: DemoProjectSpec,
	context: {
		workspaceId: string;
		ownerId: string;
		collaboratorIds: string[];
	},
) {
	const projectCreatedAt = daysAgo(HISTORY_DAYS, 9);

	const [project] = await db
		.insert(projects)
		.values({
			workspaceId: context.workspaceId,
			ownerId: context.ownerId,
			name: spec.name,
			description: spec.description,
			status: "active",
			priority: pick(TASK_PRIORITIES),
			category: spec.category,
			startDate: projectCreatedAt,
			dueDate: new Date(Date.now() + 21 * MILLISECONDS_PER_DAY),
			createdAt: projectCreatedAt,
			updatedAt: daysAgo(Math.floor(random() * 5)),
		})
		.returning();

	for (const collaboratorId of context.collaboratorIds) {
		await db
			.insert(projectMembers)
			.values({
				projectId: project.id,
				userId: collaboratorId,
				position: "Contributor",
				accessLevel: "member",
			})
			.onConflictDoNothing();
	}

	const createdBoards = await db
		.insert(boards)
		.values(
			BOARD_NAMES.map((name, index) => ({
				projectId: project.id,
				workspaceId: context.workspaceId,
				name,
				position: index,
				isCompletionBoard: name === "Done",
				createdAt: projectCreatedAt,
			})),
		)
		.returning();

	const doneBoard = createdBoards.find((board) => board.isCompletionBoard);
	const openBoards = createdBoards.filter((board) => !board.isCompletionBoard);

	const assignablePeople = [context.ownerId, ...context.collaboratorIds];
	let completedCount = 0;

	for (let index = 0; index < spec.taskCount; index++) {
		const isCompleted = random() < spec.completionRate;

		// Created early in the window, so there is room for a completion to land
		// after it. A task created today and completed today would report a cycle
		// time of zero and quietly drag the average down.
		const createdAt = daysAgo(
			HISTORY_DAYS - Math.floor(random() * (HISTORY_DAYS - 8)),
			9,
		);

		// Overdue coverage: about one in six open tasks is given a due date that
		// has already passed, so the "Overdue" segment of the status chart is
		// actually exercised rather than always being empty.
		const isOverdue = !isCompleted && random() < 0.17;
		const dueDate = isOverdue
			? daysAgo(Math.floor(random() * 6) + 1)
			: new Date(Date.now() + Math.floor(random() * 20) * MILLISECONDS_PER_DAY);

		const board = isCompleted ? (doneBoard ?? openBoards[0]) : pick(openBoards);

		const [task] = await db
			.insert(tasks)
			.values({
				projectId: project.id,
				boardId: board.id,
				position: index,
				name: `${pick(TASK_TITLES)}`,
				category: spec.category,
				isCompleted,
				status: isCompleted ? "Completed" : pick(OPEN_STATUSES),
				priority: pick(TASK_PRIORITIES),
				startDate: createdAt,
				dueDate,
				createdAt,
				updatedAt: createdAt,
			})
			.returning();

		const assigneeId = pick(assignablePeople);
		await db
			.insert(taskAssignees)
			.values({ taskId: task.id, userId: assigneeId, createdAt })
			.onConflictDoNothing();

		await db.insert(activityLogs).values({
			workspaceId: context.workspaceId,
			projectId: project.id,
			taskId: task.id,
			actorId: assigneeId,
			actionType: "TASK_CREATED",
			details: `Created task "${task.name}"`,
			createdAt,
			updatedAt: createdAt,
		});

		if (!isCompleted) continue;

		completedCount++;

		// The completion lands between one and twelve days after creation, and
		// never in the future. This single timestamp is what every headline metric
		// on the analytics page is ultimately derived from: velocity counts these
		// rows, the trend chart buckets them by day, and average task time
		// subtracts the task's createdAt from this.
		const cycleDays = 1 + Math.floor(random() * 12);
		const completedAtMs = Math.min(
			createdAt.getTime() + cycleDays * MILLISECONDS_PER_DAY,
			Date.now() - MILLISECONDS_PER_DAY,
		);
		const completedAt = new Date(completedAtMs);

		await db.insert(activityLogs).values({
			workspaceId: context.workspaceId,
			projectId: project.id,
			taskId: task.id,
			actorId: assigneeId,
			actionType: "TASK_COMPLETED",
			details: `Marked "${task.name}" complete`,
			createdAt: completedAt,
			updatedAt: completedAt,
		});

		await db
			.update(tasks)
			.set({ updatedAt: completedAt })
			.where(eq(tasks.id, task.id));
	}

	return { name: spec.name, total: spec.taskCount, completed: completedCount };
}

async function main() {
	const user = await resolveTargetUser();
	const workspace = await resolveWorkspace(user.id);

	console.log(`Seeding analytics demo data for ${user.email}`);
	console.log(`Workspace: ${workspace.name} (${workspace.id})`);

	const removed = await clearPreviousSeed(workspace.id);
	if (removed > 0) {
		console.log(`Removed ${removed} project(s) from a previous seed run.`);
	}

	const collaborators = await resolveCollaborators(user.id);
	if (collaborators.length > 0) {
		console.log(
			`Sharing the demo projects with ${collaborators.length} other account(s).`,
		);
	} else {
		console.log(
			"Only one account in this database, so every task is assigned to it.",
		);
	}

	const summaries = [];
	for (const spec of DEMO_PROJECTS) {
		summaries.push(
			await seedProject(spec, {
				workspaceId: workspace.id,
				ownerId: user.id,
				collaboratorIds: collaborators.map((person) => person.id),
			}),
		);
	}

	const totalTasks = summaries.reduce((sum, row) => sum + row.total, 0);
	const totalCompleted = summaries.reduce((sum, row) => sum + row.completed, 0);

	console.log("\nSeeded:");
	for (const row of summaries) {
		console.log(`  ${row.name}: ${row.completed}/${row.total} complete`);
	}
	console.log(
		`\n${totalTasks} tasks, ${totalCompleted} completed, spread over the last ${HISTORY_DAYS} days.`,
	);
	console.log(
		`Expect roughly ${Math.round((totalCompleted / totalTasks) * 100)}% team efficiency on /analytics.`,
	);
	console.log("Done.");
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error("Seed failed:", error);
		process.exit(1);
	});
