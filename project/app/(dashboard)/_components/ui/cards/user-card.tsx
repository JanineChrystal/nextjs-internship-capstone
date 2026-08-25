import { FolderKanban, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { TagBadge } from "@/app/(dashboard)/_components/ui/badges/tag-badge";
import { Button } from "@/components/ui/buttons/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { WorkspaceMemberOutputDTO } from "@/lib/dtos/workspace-member-dto";

interface UserCardProps {
	user: WorkspaceMemberOutputDTO;
	isSelected: boolean;
	onToggleSelect: (userId: string) => void;
	onRemove: (userId: string) => void;
}

export const UserCard = ({
	user,
	isSelected,
	onToggleSelect,
	onRemove,
}: UserCardProps) => {
	return (
		<div className="relative group overflow-hidden rounded-xl border border-outline-variant bg-surface transition-all hover:shadow-md">
			{/* selection checkbox */}
			<div className="absolute top-3 left-3 z-10">
				<Checkbox
					checked={isSelected}
					onCheckedChange={() => onToggleSelect(user.id)}
					className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
					aria-label={`Select ${user.name}`}
				/>
			</div>

			{/* hover removal action */}
			<div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
				<Button
					type="button"
					variant="ghost"
					size="icon"
					onClick={() => onRemove(user.id)}
					className="h-7 w-7 text-secondary hover:text-error hover:bg-error/10 rounded-full"
					aria-label={`Remove ${user.name} from workspace`}
				>
					<X className="h-4 w-4" />
				</Button>
			</div>

			<div className="p-6 flex flex-col items-center text-center mt-2">
				{/* interactive avatar */}
				<Link href={`/profile/${user.id}`} className="mb-4">
					<div className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-outline-variant hover:border-primary transition-colors cursor-pointer">
						{user.avatarUrl ? (
							<Image
								src={user.avatarUrl}
								alt={user.name}
								fill
								className="object-cover"
							/>
						) : (
							<div className="h-full w-full bg-surface-container-low flex items-center justify-center text-2xl font-semibold text-on-surface">
								{user.name.charAt(0)}
							</div>
						)}
					</div>
				</Link>

				{/* user identification */}
				<Link href={`/profile/${user.id}`} className="hover:underline">
					<h3 className="font-semibold text-lg text-on-surface truncate w-full max-w-50">
						{user.name}
					</h3>
				</Link>
				<p className="text-sm text-secondary mb-4 truncate w-full max-w-50">
					{user.email}
				</p>

				{/* role tags */}
				<div className="flex flex-wrap justify-center gap-2 mb-4 h-14 overflow-hidden">
					{user.jobRoles.map((role) => (
						<TagBadge key={role} tag={role} />
					))}
				</div>

				{/* project statistics */}
				<div className="flex items-center gap-2 text-sm text-secondary bg-surface-container-low px-3 py-1.5 rounded-md mt-auto">
					<FolderKanban className="h-4 w-4" />
					<span>
						{user.projectCount} Project{user.projectCount !== 1 ? "s" : ""}
					</span>
				</div>
			</div>
		</div>
	);
};
