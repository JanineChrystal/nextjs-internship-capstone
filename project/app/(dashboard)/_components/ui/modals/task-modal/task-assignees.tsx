import Image from "next/image";
import type { Assignee, GridTask } from "@/types/task";
import { AssigneeSelector } from "../../../../projects/_components/ui/assignee-selector";

interface TaskAssigneesProps {
	taskData: Partial<GridTask>;
	handleChange: (updates: Partial<GridTask>) => void;
}

export function TaskAssignees({ taskData, handleChange }: TaskAssigneesProps) {
	return (
		<div className="space-y-2 pt-2">
			<span className="block text-xs font-medium text-secondary uppercase tracking-wider">
				Assignees
			</span>
			<div className="flex items-center gap-2 flex-wrap">
				<AssigneeSelector
					assignees={taskData.assignees || []}
					onAssigneesChange={(newAssignees) =>
						handleChange({ assignees: newAssignees })
					}
				/>

				{(taskData.assignees || []).map((assignee: Assignee) => (
					<div
						key={assignee.userId}
						className="flex items-center gap-2 p-1.5 px-3 rounded-full border border-outline-variant bg-surface-container-lowest"
					>
						<Image
							src={assignee.avatarUrl}
							alt="Avatar"
							width={20}
							height={20}
							className="rounded-full bg-surface-variant shrink-0"
						/>
						<span className="text-sm font-medium">{assignee.name}</span>
					</div>
				))}
			</div>
		</div>
	);
}
