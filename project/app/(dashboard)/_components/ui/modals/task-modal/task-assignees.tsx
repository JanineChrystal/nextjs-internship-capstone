import { MemberAvatarChip } from "@/app/(dashboard)/_components/ui/avatars/member-avatar-chip";
import type { Assignee, GridTask } from "@/types/task";
import { AssigneeSelector } from "../../../../projects/_components/ui/assignee-selector";

interface TaskAssigneesProps {
	taskData: Partial<GridTask>;
	handleChange: (updates: Partial<GridTask>) => void;
}

export function TaskAssignees({ taskData, handleChange }: TaskAssigneesProps) {
	const assignees = taskData.assignees || [];

	const removeAssignee = (userId: string) => {
		handleChange({ assignees: assignees.filter((a) => a.userId !== userId) });
	};

	return (
		<div className="space-y-2 pt-2">
			<span className="block text-xs font-medium text-secondary uppercase tracking-wider">
				Assignees
			</span>
			<div className="flex items-center gap-2 flex-wrap">
				<AssigneeSelector
					assignees={assignees}
					onAssigneesChange={(newAssignees) =>
						handleChange({ assignees: newAssignees })
					}
				/>

				{assignees.map((assignee: Assignee) => (
					<MemberAvatarChip
						key={assignee.userId}
						name={assignee.name}
						avatarUrl={assignee.avatarUrl}
						onRemove={() => removeAssignee(assignee.userId)}
					/>
				))}
			</div>
		</div>
	);
}
