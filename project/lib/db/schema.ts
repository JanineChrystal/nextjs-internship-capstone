import { relations, sql } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	unique,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

// ENUMS
export const workspaceStatusEnum = pgEnum("WorkspaceStatus", [
	"pending",
	"active",
]);
export const projectStatusEnum = pgEnum("ProjectStatus", [
	"active",
	"completed",
	"overdue",
	"archived",
]);
export const accessLevelEnum = pgEnum("AccessLevel", [
	"owner",
	"co-owner",
	"member",
	"guest",
]);
export const taskPriorityEnum = pgEnum("TaskPriority", [
	"low",
	"medium",
	"high",
	"urgent",
]);
export const attachmentTypeEnum = pgEnum("AttachmentType", ["file", "link"]);
export const actionTypeEnum = pgEnum("ActionType", [
	"INVITE_SENT",
	"INVITE_ACCEPTED",
	"WORKSPACE_MEMBER_REMOVED",
	"PROJECT_MEMBER_ADDED",
	"PROJECT_MEMBER_REMOVED",
	"BOARD_CREATED",
	"BOARD_REORDERED",
	"BOARD_DELETED",
	"TASK_CREATED",
	"TASK_UPDATED",
	"TASK_ASSIGNED",
	"TASK_COMPLETED",
	"COMMENT_ADDED",
]);

export const categoryTypeEnum = pgEnum("CategoryType", ["project", "task"]);

// GLOBAL & WORKSPACE ENTITIES
export const users = pgTable("Users", {
	id: uuid("id").primaryKey().defaultRandom(),
	clerkId: text("clerkId").notNull().unique(),
	email: text("email").notNull().unique(),
	firstName: text("firstName"),
	lastName: text("lastName"),
	imageUrl: text("imageUrl"),
	createdAt: timestamp("createdAt").defaultNow().notNull(),
	updatedAt: timestamp("updatedAt").defaultNow().notNull(),
	deletedAt: timestamp("deletedAt"),
});

export const workspaces = pgTable("Workspaces", {
	id: uuid("id").primaryKey().defaultRandom(),
	ownerId: uuid("ownerId")
		.references(() => users.id, { onDelete: "cascade" })
		.notNull(),
	name: text("name").notNull(),
	createdAt: timestamp("createdAt").defaultNow().notNull(),
	updatedAt: timestamp("updatedAt").defaultNow().notNull(),
	deletedAt: timestamp("deletedAt"),
});

export const categories = pgTable(
	"Categories",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		workspaceId: uuid("workspaceId")
			.references(() => workspaces.id, { onDelete: "cascade" })
			.notNull(),
		name: text("name").notNull(),
		color: text("color").default("#94a3b8").notNull(), // slate-400 fallback
		type: categoryTypeEnum("type").notNull(),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
		updatedAt: timestamp("updatedAt").defaultNow().notNull(),
	},
	(table) => ({
		workspaceCategoryUnique: unique().on(
			table.workspaceId,
			table.name,
			table.type,
		),
	}),
);

export const workspaceMembers = pgTable(
	"WorkspaceMembers",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		workspaceId: uuid("workspaceId")
			.references(() => workspaces.id, { onDelete: "cascade" })
			.notNull(),
		userId: uuid("userId")
			.references(() => users.id, { onDelete: "cascade" })
			.notNull(),
		status: workspaceStatusEnum("status").default("pending").notNull(),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
		updatedAt: timestamp("updatedAt").defaultNow().notNull(),
		deletedAt: timestamp("deletedAt"),
	},
	(table) => ({
		workspaceUserUnique: unique().on(table.workspaceId, table.userId),
		// Directory and membership lookups filter by user across workspaces.
		userIdx: index("WorkspaceMembers_userId_idx").on(table.userId),
	}),
);

export const teams = pgTable(
	"Teams",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		workspaceId: uuid("workspaceId")
			.references(() => workspaces.id, { onDelete: "cascade" })
			.notNull(),
		name: text("name").notNull(),
		description: text("description"),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
		updatedAt: timestamp("updatedAt").defaultNow().notNull(),
		deletedAt: timestamp("deletedAt"),
	},
	(table) => ({
		// Team names double as their identity in pickers, so duplicates inside a
		// single workspace would be indistinguishable to the user.
		//
		// Scoped to live rows only. Teams soft-delete, and a full constraint would
		// permanently burn a name once deleted. It also must NOT use the resurrect
		// pattern that workspaceMembers/projectMembers use: recreating a deleted
		// "Design" team should be a fresh team, not a revival of its old roster.
		workspaceTeamNameUnique: uniqueIndex("Teams_workspaceId_name_live_unique")
			.on(table.workspaceId, table.name)
			.where(sql`"deletedAt" is null`),
	}),
);

export const teamMembers = pgTable(
	"TeamMembers",
	{
		teamId: uuid("teamId")
			.references(() => teams.id, { onDelete: "cascade" })
			.notNull(),
		userId: uuid("userId")
			.references(() => users.id, { onDelete: "cascade" })
			.notNull(),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.teamId, table.userId] }),
		// The PK is (teamId, userId), so "which teams is this user in?" - the
		// direction every permission check runs - has no usable index without this.
		userIdx: index("TeamMembers_userId_idx").on(table.userId),
	}),
);

export const notificationSettings = pgTable("NotificationSettings", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("userId")
		.references(() => users.id, { onDelete: "cascade" })
		.notNull()
		.unique(),
	emailWorkspaceInvites: boolean("emailWorkspaceInvites")
		.default(true)
		.notNull(),
	// Separate from emailWorkspaceInvites because the two are genuinely different
	// events to the person receiving them: being added to someone's directory is
	// not the same as being given access to a project. Both are recorded as
	// INVITE_SENT, so they are told apart by whether the row carries a projectId.
	emailProjectInvites: boolean("emailProjectInvites").default(true).notNull(),
	emailTaskCompletions: boolean("emailTaskCompletions").default(true).notNull(),
	emailProjectCompletions: boolean("emailProjectCompletions")
		.default(true)
		.notNull(),
	emailCommentMentions: boolean("emailCommentMentions").default(true).notNull(),
	// Both of these are stored and editable now, but nothing fires them yet.
	// emailCommentViolations waits on Phase 6's moderation pipeline, and
	// emailProjectOverdue waits on something that actually checks a project's due
	// date - there is no equivalent of isTaskOverdue() running for projects.
	// Adding the columns now means the preference survives; it does not mean the
	// email sends.
	emailCommentViolations: boolean("emailCommentViolations")
		.default(true)
		.notNull(),
	emailProjectOverdue: boolean("emailProjectOverdue").default(true).notNull(),
	createdAt: timestamp("createdAt").defaultNow().notNull(),
	updatedAt: timestamp("updatedAt").defaultNow().notNull(),
	deletedAt: timestamp("deletedAt"),
});

// PROJECT MANAGEMENT ENTITIES
export const projects = pgTable("Projects", {
	id: uuid("id").primaryKey().defaultRandom(),
	workspaceId: uuid("workspaceId")
		.references(() => workspaces.id, { onDelete: "cascade" })
		.notNull(),
	ownerId: uuid("ownerId")
		.references(() => users.id, { onDelete: "cascade" })
		.notNull(),
	name: text("name").notNull(),
	description: text("description"),
	status: projectStatusEnum("status").default("active").notNull(),
	priority: taskPriorityEnum("priority").default("medium").notNull(),
	category: text("category"),
	startDate: timestamp("startDate"),
	dueDate: timestamp("dueDate"),
	createdAt: timestamp("createdAt").defaultNow().notNull(),
	updatedAt: timestamp("updatedAt").defaultNow().notNull(),
	// Set when the item is put aside deliberately. Kept separate from deletedAt
	// because the two mean different things and have different exits: archived
	// items are hidden from lists but permanent, trashed items are hidden and on
	// a countdown to real deletion. One nullable timestamp each keeps "which
	// state is this in" a question the WHERE clause can answer.
	archivedAt: timestamp("archivedAt"),
	deletedAt: timestamp("deletedAt"),
});

export const projectMembers = pgTable(
	"ProjectMembers",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		projectId: uuid("projectId")
			.references(() => projects.id, { onDelete: "cascade" })
			.notNull(),
		userId: uuid("userId")
			.references(() => users.id, { onDelete: "cascade" })
			.notNull(),
		position: text("position").notNull(),
		accessLevel: accessLevelEnum("accessLevel").notNull(),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
		updatedAt: timestamp("updatedAt").defaultNow().notNull(),
		deletedAt: timestamp("deletedAt"),
	},
	(table) => ({
		projectUserUnique: unique().on(table.projectId, table.userId),
	}),
);

export const projectTeams = pgTable(
	"ProjectTeams",
	{
		projectId: uuid("projectId")
			.references(() => projects.id, { onDelete: "cascade" })
			.notNull(),
		teamId: uuid("teamId")
			.references(() => teams.id, { onDelete: "cascade" })
			.notNull(),
		accessLevel: accessLevelEnum("accessLevel").default("member").notNull(),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
		updatedAt: timestamp("updatedAt").defaultNow().notNull(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.projectId, table.teamId] }),
		// Reverse of the PK order: "which projects does this team grant access to?"
		teamIdx: index("ProjectTeams_teamId_idx").on(table.teamId),
	}),
);

export const projectInvites = pgTable("ProjectInvites", {
	id: uuid("id").primaryKey().defaultRandom(),
	projectId: uuid("projectId")
		.references(() => projects.id, { onDelete: "cascade" })
		.notNull(),
	inviteToken: text("inviteToken").notNull().unique(),
	defaultAccessLevel: accessLevelEnum("defaultAccessLevel")
		.default("member")
		.notNull(),
	defaultPosition: text("defaultPosition").default("Contributor").notNull(),
	expiresAt: timestamp("expiresAt"),
	createdAt: timestamp("createdAt").defaultNow().notNull(),
	updatedAt: timestamp("updatedAt").defaultNow().notNull(),
	deletedAt: timestamp("deletedAt"),
});

/**
 * Invitations addressed to people who have not signed up yet.
 *
 * Keyed by email rather than userId, because there is no Users row to reference
 * at the time the invite is made - that is the whole point. When the person
 * signs up, the Clerk webhook converts every live row for their address into
 * real WorkspaceMembers and ProjectMembers rows.
 */
export const pendingInvites = pgTable(
	"PendingInvites",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		workspaceId: uuid("workspaceId")
			.references(() => workspaces.id, { onDelete: "cascade" })
			.notNull(),
		// Null means a directory-only invite, made from the team page with no
		// project attached.
		projectId: uuid("projectId").references(() => projects.id, {
			onDelete: "cascade",
		}),
		// Stored lower-cased so lookups on signup match regardless of how the
		// address was typed.
		email: text("email").notNull(),
		invitedBy: uuid("invitedBy")
			.references(() => users.id, { onDelete: "cascade" })
			.notNull(),
		position: text("position").default("Contributor").notNull(),
		accessLevel: accessLevelEnum("accessLevel").default("member").notNull(),
		// Set when the invite is converted into real membership rows, which keeps
		// an audit trail that a plain delete would lose.
		claimedAt: timestamp("claimedAt"),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
		updatedAt: timestamp("updatedAt").defaultNow().notNull(),
		deletedAt: timestamp("deletedAt"),
	},
	(table) => ({
		// Two partial indexes rather than one, because Postgres treats NULLs as
		// distinct: a single unique on (workspaceId, email, projectId) would let
		// the same address be invited to the directory any number of times.
		//
		// Both are scoped to rows that are still outstanding - not merely
		// undeleted. A claimed invite is history, and leaving it in the unique
		// scope meant a claimed row permanently blocked any future invite to the
		// same address and project, which bites as soon as someone is invited,
		// leaves, and is invited back.
		projectInviteUnique: uniqueIndex("PendingInvites_project_email_live_unique")
			.on(table.workspaceId, table.email, table.projectId)
			.where(
				sql`"deletedAt" is null and "claimedAt" is null and "projectId" is not null`,
			),
		workspaceInviteUnique: uniqueIndex(
			"PendingInvites_workspace_email_live_unique",
		)
			.on(table.workspaceId, table.email)
			.where(
				sql`"deletedAt" is null and "claimedAt" is null and "projectId" is null`,
			),
		// The claim path looks these up by address alone, across every workspace.
		emailIdx: index("PendingInvites_email_idx").on(table.email),
	}),
);

export const boards = pgTable("Boards", {
	id: uuid("id").primaryKey().defaultRandom(),
	projectId: uuid("projectId")
		.references(() => projects.id, { onDelete: "cascade" })
		.notNull(),
	workspaceId: uuid("workspaceId")
		.references(() => workspaces.id, { onDelete: "cascade" })
		.notNull(),
	name: text("name").notNull(),
	position: integer("position").default(0).notNull(),
	// Marks the column that completed tasks are moved into. Identified by this
	// flag rather than by name, so the board stays renameable.
	isCompletionBoard: boolean("isCompletionBoard").default(false).notNull(),
	createdAt: timestamp("createdAt").defaultNow().notNull(),
	updatedAt: timestamp("updatedAt").defaultNow().notNull(),
	deletedAt: timestamp("deletedAt"),
});

// TASK ENGINE ENTITIES
export const tasks = pgTable("Tasks", {
	id: uuid("id").primaryKey().defaultRandom(),
	projectId: uuid("projectId")
		.references(() => projects.id, { onDelete: "cascade" })
		.notNull(),
	boardId: uuid("boardId")
		.references(() => boards.id, { onDelete: "cascade" })
		.notNull(),
	position: integer("position").default(0).notNull(),
	name: text("name").notNull(),
	category: text("category"),
	// Authoritative completion state. Deliberately independent of `status` and
	// of which board the task sits in, so renaming or deleting a board can
	// never lose it.
	isCompleted: boolean("isCompleted").default(false).notNull(),
	status: text("status").default("Not Started").notNull(),
	// When the user last set `status` by hand. Compared against dueDate to
	// decide whether an overdue task should still display as "Overdue" or
	// whether the user has deliberately overridden it since it lapsed.
	statusOverriddenAt: timestamp("statusOverriddenAt"),
	// The column the task was auto-moved out of when it was completed, so
	// un-completing can put it back where it came from.
	previousBoardId: uuid("previousBoardId"),
	priority: taskPriorityEnum("priority").notNull(),
	startDate: timestamp("startDate"),
	dueDate: timestamp("dueDate"),
	notes: text("notes"),
	createdAt: timestamp("createdAt").defaultNow().notNull(),
	updatedAt: timestamp("updatedAt").defaultNow().notNull(),
	archivedAt: timestamp("archivedAt"),
	deletedAt: timestamp("deletedAt"),
});

export const taskAssignees = pgTable(
	"TaskAssignees",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		taskId: uuid("taskId")
			.references(() => tasks.id, { onDelete: "cascade" })
			.notNull(),
		userId: uuid("userId")
			.references(() => users.id, { onDelete: "cascade" })
			.notNull(),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
		updatedAt: timestamp("updatedAt").defaultNow().notNull(),
		deletedAt: timestamp("deletedAt"),
	},
	(table) => ({
		taskUserUnique: unique().on(table.taskId, table.userId),
	}),
);

export const checklists = pgTable("Checklists", {
	id: uuid("id").primaryKey().defaultRandom(),
	taskId: uuid("taskId")
		.references(() => tasks.id, { onDelete: "cascade" })
		.notNull(),
	title: text("title").notNull(),
	isCompleted: boolean("isCompleted").default(false).notNull(),
	createdAt: timestamp("createdAt").defaultNow().notNull(),
	updatedAt: timestamp("updatedAt").defaultNow().notNull(),
	deletedAt: timestamp("deletedAt"),
});

export const attachments = pgTable("Attachments", {
	id: uuid("id").primaryKey().defaultRandom(),
	taskId: uuid("taskId")
		.references(() => tasks.id, { onDelete: "cascade" })
		.notNull(),
	name: text("name").notNull(),
	url: text("url").notNull(),
	type: attachmentTypeEnum("type").notNull(),
	createdAt: timestamp("createdAt").defaultNow().notNull(),
	updatedAt: timestamp("updatedAt").defaultNow().notNull(),
	deletedAt: timestamp("deletedAt"),
});

// COLLABORATION & AUDITING ENTITIES
export const comments = pgTable("Comments", {
	id: uuid("id").primaryKey().defaultRandom(),
	taskId: uuid("taskId")
		.references(() => tasks.id, { onDelete: "cascade" })
		.notNull(),
	authorId: uuid("authorId")
		.references(() => users.id, { onDelete: "cascade" })
		.notNull(),
	parentId: uuid("parentId"),
	body: text("body").notNull(),
	isFlagged: boolean("isFlagged").default(false).notNull(),
	flagReason: text("flagReason"),
	moderatedById: uuid("moderatedById").references(() => users.id),
	moderatedAt: timestamp("moderatedAt"),
	createdAt: timestamp("createdAt").defaultNow().notNull(),
	updatedAt: timestamp("updatedAt").defaultNow().notNull(),
	deletedAt: timestamp("deletedAt"),
});

export const commentMentions = pgTable(
	"CommentMentions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		commentId: uuid("commentId")
			.references(() => comments.id, { onDelete: "cascade" })
			.notNull(),
		mentionedUserId: uuid("mentionedUserId")
			.references(() => users.id, { onDelete: "cascade" })
			.notNull(),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
		updatedAt: timestamp("updatedAt").defaultNow().notNull(),
		deletedAt: timestamp("deletedAt"),
	},
	(table) => ({
		commentMentionUnique: unique().on(table.commentId, table.mentionedUserId),
	}),
);

export const activityLogs = pgTable("ActivityLogs", {
	id: uuid("id").primaryKey().defaultRandom(),
	workspaceId: uuid("workspaceId")
		.references(() => workspaces.id, { onDelete: "cascade" })
		.notNull(),
	projectId: uuid("projectId").references(() => projects.id, {
		onDelete: "cascade",
	}),
	taskId: uuid("taskId").references(() => tasks.id, { onDelete: "cascade" }),
	actorId: uuid("actorId")
		.references(() => users.id, { onDelete: "cascade" })
		.notNull(),
	targetUserId: uuid("targetUserId").references(() => users.id, {
		onDelete: "cascade",
	}),
	actionType: actionTypeEnum("actionType").notNull(),
	details: text("details"),
	createdAt: timestamp("createdAt").defaultNow().notNull(),
	updatedAt: timestamp("updatedAt").defaultNow().notNull(),
	deletedAt: timestamp("deletedAt"),
});

export const notifications = pgTable("Notifications", {
	id: uuid("id").primaryKey().defaultRandom(),
	recipientId: uuid("recipientId")
		.references(() => users.id, { onDelete: "cascade" })
		.notNull(),
	actorId: uuid("actorId").references(() => users.id, { onDelete: "cascade" }),
	workspaceId: uuid("workspaceId").references(() => workspaces.id, {
		onDelete: "cascade",
	}),
	projectId: uuid("projectId").references(() => projects.id, {
		onDelete: "cascade",
	}),
	taskId: uuid("taskId").references(() => tasks.id, { onDelete: "cascade" }),
	actionType: actionTypeEnum("actionType").notNull(),
	message: text("message").notNull(),
	isRead: boolean("isRead").default(false).notNull(),
	createdAt: timestamp("createdAt").defaultNow().notNull(),
	updatedAt: timestamp("updatedAt").defaultNow().notNull(),
	deletedAt: timestamp("deletedAt"),
});

// RELATIONS
export const usersRelations = relations(users, ({ one, many }) => ({
	ownedWorkspaces: many(workspaces),
	ownedProjects: many(projects),
	workspaceMemberships: many(workspaceMembers),
	projectMemberships: many(projectMembers),
	teamMemberships: many(teamMembers),
	taskAssignments: many(taskAssignees),
	comments: many(comments),
	moderatedComments: many(comments, { relationName: "moderator" }),
	mentions: many(commentMentions),
	actionsPerformed: many(activityLogs, { relationName: "actor" }),
	actionsTargeted: many(activityLogs, { relationName: "target" }),
	notificationsReceived: many(notifications, { relationName: "recipient" }),
	notificationsTriggered: many(notifications, { relationName: "actor" }),
	notificationSettings: one(notificationSettings, {
		fields: [users.id],
		references: [notificationSettings.userId],
	}),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
	recipient: one(users, {
		fields: [notifications.recipientId],
		references: [users.id],
		relationName: "recipient",
	}),
	actor: one(users, {
		fields: [notifications.actorId],
		references: [users.id],
		relationName: "actor",
	}),
	workspace: one(workspaces, {
		fields: [notifications.workspaceId],
		references: [workspaces.id],
	}),
	project: one(projects, {
		fields: [notifications.projectId],
		references: [projects.id],
	}),
	task: one(tasks, {
		fields: [notifications.taskId],
		references: [tasks.id],
	}),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
	owner: one(users, {
		fields: [workspaces.ownerId],
		references: [users.id],
	}),
	members: many(workspaceMembers),
	teams: many(teams),
	projects: many(projects),
	boards: many(boards),
	categories: many(categories),
	activityLogs: many(activityLogs),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
	workspace: one(workspaces, {
		fields: [projects.workspaceId],
		references: [workspaces.id],
	}),
	owner: one(users, {
		fields: [projects.ownerId],
		references: [users.id],
	}),
	members: many(projectMembers),
	teams: many(projectTeams),
	invites: many(projectInvites),
	boards: many(boards),
	tasks: many(tasks),
	activityLogs: many(activityLogs),
}));

export const projectInvitesRelations = relations(projectInvites, ({ one }) => ({
	project: one(projects, {
		fields: [projectInvites.projectId],
		references: [projects.id],
	}),
}));

export const boardsRelations = relations(boards, ({ one, many }) => ({
	project: one(projects, {
		fields: [boards.projectId],
		references: [projects.id],
	}),
	workspace: one(workspaces, {
		fields: [boards.workspaceId],
		references: [workspaces.id],
	}),
	tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
	project: one(projects, {
		fields: [tasks.projectId],
		references: [projects.id],
	}),
	board: one(boards, {
		fields: [tasks.boardId],
		references: [boards.id],
	}),
	assignees: many(taskAssignees),
	checklists: many(checklists),
	attachments: many(attachments),
	comments: many(comments),
	activityLogs: many(activityLogs),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
	task: one(tasks, {
		fields: [comments.taskId],
		references: [tasks.id],
	}),
	author: one(users, {
		fields: [comments.authorId],
		references: [users.id],
	}),
	moderator: one(users, {
		fields: [comments.moderatedById],
		references: [users.id],
		relationName: "moderator",
	}),
	parentComment: one(comments, {
		fields: [comments.parentId],
		references: [comments.id],
		relationName: "comment_threads",
	}),
	replies: many(comments, {
		relationName: "comment_threads",
	}),
	mentions: many(commentMentions),
}));

export const workspaceMembersRelations = relations(
	workspaceMembers,
	({ one }) => ({
		workspace: one(workspaces, {
			fields: [workspaceMembers.workspaceId],
			references: [workspaces.id],
		}),
		user: one(users, {
			fields: [workspaceMembers.userId],
			references: [users.id],
		}),
	}),
);

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
	project: one(projects, {
		fields: [projectMembers.projectId],
		references: [projects.id],
	}),
	user: one(users, {
		fields: [projectMembers.userId],
		references: [users.id],
	}),
}));

export const taskAssigneesRelations = relations(taskAssignees, ({ one }) => ({
	task: one(tasks, {
		fields: [taskAssignees.taskId],
		references: [tasks.id],
	}),
	user: one(users, {
		fields: [taskAssignees.userId],
		references: [users.id],
	}),
}));

export const commentMentionsRelations = relations(
	commentMentions,
	({ one }) => ({
		comment: one(comments, {
			fields: [commentMentions.commentId],
			references: [comments.id],
		}),
		user: one(users, {
			fields: [commentMentions.mentionedUserId],
			references: [users.id],
		}),
	}),
);

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
	workspace: one(workspaces, {
		fields: [activityLogs.workspaceId],
		references: [workspaces.id],
	}),
	project: one(projects, {
		fields: [activityLogs.projectId],
		references: [projects.id],
	}),
	task: one(tasks, {
		fields: [activityLogs.taskId],
		references: [tasks.id],
	}),
	actor: one(users, {
		fields: [activityLogs.actorId],
		references: [users.id],
		relationName: "actor",
	}),
	targetUser: one(users, {
		fields: [activityLogs.targetUserId],
		references: [users.id],
		relationName: "target",
	}),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
	workspace: one(workspaces, {
		fields: [teams.workspaceId],
		references: [workspaces.id],
	}),
	members: many(teamMembers),
	projectTeams: many(projectTeams),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
	team: one(teams, {
		fields: [teamMembers.teamId],
		references: [teams.id],
	}),
	user: one(users, {
		fields: [teamMembers.userId],
		references: [users.id],
	}),
}));

export const projectTeamsRelations = relations(projectTeams, ({ one }) => ({
	project: one(projects, {
		fields: [projectTeams.projectId],
		references: [projects.id],
	}),
	team: one(teams, {
		fields: [projectTeams.teamId],
		references: [teams.id],
	}),
}));
