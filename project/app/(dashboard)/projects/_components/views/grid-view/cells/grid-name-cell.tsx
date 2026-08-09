import { Info, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/buttons/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTaskStore } from "@/stores/use-task-store";
import type { TaskModalActionId } from "@/types/task";
import { TASK_MODAL_ACTIONS } from "../../../../_constants/task-modal-constants";
import { useTaskModal } from "../../../../_hooks/use-task-modal";

interface GridNameCellProps {
	className: string;
	taskId: string;
	taskName: string;
}

export function GridNameCell({
	className,
	taskId,
	taskName,
}: GridNameCellProps) {
	const { openTaskModal } = useTaskStore();
	const { handleAction } = useTaskModal();

	return (
		<div
			className={`${className} flex items-center justify-between group/name pr-4`}
		>
			<span className="font-medium text-sm text-foreground truncate mr-2">
				{taskName}
			</span>
			<div className="flex items-center opacity-0 group-hover/name:opacity-100 transition-opacity">
				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6 text-secondary hover:text-foreground mr-1"
					onClick={() => openTaskModal(taskId)}
				>
					<Info className="h-4 w-4" />
				</Button>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="h-6 w-6 text-secondary hover:text-foreground"
						>
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-48">
						{TASK_MODAL_ACTIONS.map((action) => {
							const Icon = action.icon;
							return (
								<DropdownMenuItem
									key={action.id}
									onClick={() =>
										handleAction(action.id as TaskModalActionId, taskId)
									}
									className={action.className}
								>
									<Icon className="h-4 w-4 mr-2" />
									{action.label}
								</DropdownMenuItem>
							);
						})}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}
