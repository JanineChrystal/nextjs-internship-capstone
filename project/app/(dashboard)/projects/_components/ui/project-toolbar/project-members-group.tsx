import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/buttons/button";
import { MemberAvatar } from "@/components/ui/member-avatar";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ProjectMember } from "@/types/member";

interface ProjectMembersGroupProps {
	visibleMembers: ProjectMember[];
	remainingCount: number;
	onAddMember: () => void;
}

export function ProjectMembersGroup({
	visibleMembers,
	remainingCount,
	onAddMember,
}: ProjectMembersGroupProps) {
	return (
		<div className="flex items-center gap-2 ml-1 border-l border-outline-variant pl-4">
			<TooltipProvider>
				<div className="flex -space-x-3">
					{visibleMembers.map((member, index) => {
						const zIndex = visibleMembers.length - index;
						return (
							<Tooltip key={member.userId}>
								<TooltipTrigger asChild>
									<MemberAvatar
										name={member.name}
										avatarUrl={member.avatarUrl}
										size="md"
										className="border-2 border-surface bg-surface-container-low cursor-pointer"
										style={{ zIndex }}
									/>
								</TooltipTrigger>
								<TooltipContent side="top">
									<p>{member.name}</p>
								</TooltipContent>
							</Tooltip>
						);
					})}
					{remainingCount > 0 && (
						<div className="w-9 h-9 rounded-full border-2 border-surface bg-surface-variant flex items-center justify-center font-label-sm text-label-sm text-secondary z-0 shrink-0">
							+{remainingCount}
						</div>
					)}
				</div>
			</TooltipProvider>
			<Button
				type="button"
				variant="outline"
				size="icon"
				onClick={onAddMember}
				className="w-9 h-9 rounded-full border border-dashed border-outline flex items-center justify-center text-secondary hover:text-on-surface hover:bg-surface-variant transition-colors hover:border-outline-variant"
			>
				<UserPlus size={18} />
			</Button>
		</div>
	);
}
