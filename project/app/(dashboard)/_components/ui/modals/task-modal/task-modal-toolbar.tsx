import {
	MoreHorizontal,
	PanelRightClose,
	PanelRightOpen,
	X,
} from "lucide-react";
import { Button } from "@/components/ui/buttons/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TaskModalActionId } from "@/lib/types/task";
import { TASK_MODAL_ACTIONS } from "../../../../projects/_constants/task-modal";

interface TaskModalToolbarProps {
	isCommentsOpen: boolean;
	toggleComments: () => void;
	isEditMode: boolean;
	isCompleted?: boolean;
	closeTaskModal: () => void;
	onAction: (actionId: TaskModalActionId) => void;
}

/**
 * task modal toolbar - the modal's own controls, laid out as a normal row in
 * the header rather than floated over it.
 *
 * It used to be absolutely positioned with a `backdrop-blur-sm` pill, which put
 * it on top of the task name and the status badge on a narrow screen - the blur
 * made the collision look intentional without making it readable. In flow, the
 * header simply reserves the space.
 */
export function TaskModalToolbar({
	isCommentsOpen,
	toggleComments,
	isEditMode,
	isCompleted,
	closeTaskModal,
	onAction,
}: TaskModalToolbarProps) {
	return (
		<div className="flex shrink-0 items-center gap-0.5">
			{isEditMode && (
				<Button
					variant="ghost"
					size="icon-sm"
					className="hidden size-8 text-secondary hover:text-foreground md:flex"
					onClick={toggleComments}
					aria-label={isCommentsOpen ? "Close comments" : "Open comments"}
				>
					{isCommentsOpen ? (
						<PanelRightClose className="size-4" />
					) : (
						<PanelRightOpen className="size-4" />
					)}
				</Button>
			)}
			{isEditMode && (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="icon-sm"
							className="size-8 text-secondary hover:text-foreground"
						>
							<MoreHorizontal className="size-4" />
							<span className="sr-only">More options</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-48">
						{TASK_MODAL_ACTIONS.map((action) => {
							const Icon = action.icon;
							return (
								<DropdownMenuItem
									key={action.id}
									onClick={() => onAction(action.id)}
									className={action.className}
								>
									<Icon className="mr-2 size-4" />
									{action.id === "TOGGLE_COMPLETION"
										? isCompleted
											? action.completedLabel
											: action.label
										: action.label}
								</DropdownMenuItem>
							);
						})}
					</DropdownMenuContent>
				</DropdownMenu>
			)}
			<Button
				variant="ghost"
				size="icon-sm"
				className="size-8 text-secondary hover:text-foreground"
				onClick={closeTaskModal}
			>
				<X className="size-4" />
				<span className="sr-only">Close</span>
			</Button>
		</div>
	);
}
