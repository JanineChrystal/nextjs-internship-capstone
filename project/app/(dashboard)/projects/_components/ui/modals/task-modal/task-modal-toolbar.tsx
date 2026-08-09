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
import type { TaskModalActionId } from "@/types/task";
import { TASK_MODAL_ACTIONS } from "../../../../_constants/task-modal-constants";

interface TaskModalToolbarProps {
	isCommentsOpen: boolean;
	toggleComments: () => void;
	isEditMode: boolean;
	isCompleted?: boolean;
	closeTaskModal: () => void;
	onAction: (actionId: TaskModalActionId) => void;
}

export function TaskModalToolbar({
	isCommentsOpen,
	toggleComments,
	isEditMode,
	isCompleted,
	closeTaskModal,
	onAction,
}: TaskModalToolbarProps) {
	return (
		<div className="absolute top-2 right-2 z-50 flex items-center gap-1 backdrop-blur-sm rounded-md p-0.5 md:border-none md:shadow-none md:bg-transparent">
			{isEditMode && (
				<Button
					variant="ghost"
					size="icon-sm"
					className="hidden md:flex h-8 w-8 text-secondary hover:text-foreground"
					onClick={toggleComments}
					aria-label={isCommentsOpen ? "Close comments" : "Open comments"}
				>
					{isCommentsOpen ? (
						<PanelRightClose className="h-4 w-4" />
					) : (
						<PanelRightOpen className="h-4 w-4" />
					)}
				</Button>
			)}
			{isEditMode && (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="icon-sm"
							className="h-8 w-8 text-secondary"
						>
							<MoreHorizontal className="h-4 w-4" />
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
									<Icon className="h-4 w-4 mr-2" />
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
				className="h-8 w-8 text-secondary hover:text-foreground"
				onClick={closeTaskModal}
			>
				<X className="h-4 w-4" />
				<span className="sr-only">Close</span>
			</Button>
		</div>
	);
}
