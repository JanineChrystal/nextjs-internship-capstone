import { UserPlus } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/buttons/button";
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
									{member.avatarUrl ? (
										<Image
											alt={member.name}
											src={member.avatarUrl}
											width={36}
											height={36}
											className="rounded-full border-2 border-surface object-cover bg-surface-container-low shrink-0 cursor-pointer"
											style={{ zIndex }}
										/>
									) : (
										<div
											className="w-9 h-9 rounded-full border-2 border-surface bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0 cursor-pointer"
											style={{ zIndex }}
										>
											{member.name.charAt(0).toUpperCase()}
										</div>
									)}
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
