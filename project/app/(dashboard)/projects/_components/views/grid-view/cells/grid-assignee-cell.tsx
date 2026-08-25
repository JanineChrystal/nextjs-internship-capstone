import { MemberAvatar } from "@/components/ui/member-avatar";
import type { Assignee } from "@/lib/types/task";
import { AssigneeSelector } from "../../../ui/assignee-selector";

interface GridAssigneeCellProps {
	className: string;
	assignees: Assignee[];
	onAssigneesChange: (assignees: Assignee[]) => void;
}

export function GridAssigneeCell({
	className,
	assignees,
	onAssigneesChange,
}: GridAssigneeCellProps) {
	return (
		<div className={`${className} flex items-center gap-1 group/assignee`}>
			<div className="flex -space-x-2">
				{assignees.slice(0, 3).map((assignee) => (
					<div
						key={assignee.name}
						className="relative inline-block hover:z-10 group/tooltip"
					>
						<MemberAvatar
							name={assignee.name}
							avatarUrl={assignee.avatarUrl}
							size="xs"
							className="border-2 border-surface hover:ring-2 ring-primary/30 transition-all"
						/>
						{/* custom css tooltip - pure css implementation to display assignee name on hover. */}
						<div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max opacity-0 transition-opacity group-hover/tooltip:opacity-100 bg-surface-container-highest text-foreground text-xs px-2 py-1 rounded shadow-sm z-50">
							{assignee.name}
						</div>
					</div>
				))}
				{assignees.length > 3 && (
					<div className="relative inline-flex items-center justify-center w-6 h-6 rounded-full bg-surface-variant border-2 border-surface text-[10px] font-medium text-secondary hover:z-10 z-0">
						+{assignees.length - 3}
					</div>
				)}
			</div>

			<AssigneeSelector
				assignees={assignees}
				onAssigneesChange={onAssigneesChange}
				triggerClassName="h-6 w-6 opacity-0 group-hover/assignee:opacity-100 bg-surface z-20"
			/>
		</div>
	);
}
