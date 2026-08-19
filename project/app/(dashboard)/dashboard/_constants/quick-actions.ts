import { FolderPlus, ListPlus, UserPlus, Users } from "lucide-react";
import type { QuickAction } from "@/lib/types/dashboard";

/**
 * The dashboard's four shortcuts.
 *
 * These were originally four buttons with no handler attached, so every one of
 * them did nothing when clicked. They were replaced with plain links to the
 * pages where the work actually happens - honest, but a link to /projects is not
 * a shortcut, it is a second click on the sidebar.
 *
 * They are now the original four actions with the real modals behind them. Each
 * one reuses the modal that already exists for it rather than a dashboard-only
 * copy, so there is one create-project form in the app, one invite form, and one
 * task editor.
 *
 * `needsProject` is what separates the two halves: creating a project or adding
 * someone to the workspace needs no project, while creating a task or adding a
 * project member does - so those two ask first.
 */
export const QUICK_ACTIONS: QuickAction[] = [
	{
		id: "create-project",
		label: "Create New Project",
		description: "Start a project and invite people to it",
		icon: FolderPlus,
		needsProject: false,
	},
	{
		id: "create-task",
		label: "Create Task",
		description: "Add a task to one of your projects",
		icon: ListPlus,
		needsProject: true,
	},
	{
		id: "add-workspace-member",
		label: "Add User to Workspace",
		description: "Add someone to your directory, without project access",
		icon: Users,
		needsProject: false,
	},
	{
		id: "add-project-member",
		label: "Add a Member to a Project",
		description: "Give someone access to a specific project",
		icon: UserPlus,
		needsProject: true,
	},
];

/**
 * The copy for the "which project?" step, per action.
 *
 * Kept beside the actions rather than inside the picker, because the picker is a
 * generic component - it should not know that one of its callers is about to
 * create a task and the other is about to send an invite.
 */
export const PROJECT_PICKER_COPY: Record<
	"create-task" | "add-project-member",
	{ title: string; description: string; confirmLabel: string }
> = {
	"create-task": {
		title: "Which project is this task for?",
		description:
			"Pick a project and the task editor will open for it. You can change the column and dates there.",
		confirmLabel: "Continue",
	},
	"add-project-member": {
		title: "Which project are you adding someone to?",
		description:
			"Pick a project and the invite form will open for it. You need to be its owner or a co-owner to send invites.",
		confirmLabel: "Continue",
	},
};
