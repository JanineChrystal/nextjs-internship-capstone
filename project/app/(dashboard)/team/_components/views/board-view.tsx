import { UserCard } from "@/app/(dashboard)/_components/ui/cards/user-card";
import type { WorkspaceMemberOutputDTO } from "@/lib/dtos/workspace-member-dto";

interface BoardViewProps {
	users: WorkspaceMemberOutputDTO[];
	selectedIds: Set<string>;
	onToggleSelect: (userId: string) => void;
	onRemove: (userId: string) => void;
}

export function BoardView({
	users,
	selectedIds,
	onToggleSelect,
	onRemove,
}: BoardViewProps) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-6">
			{users.map((user) => (
				<UserCard
					key={user.id}
					user={user}
					isSelected={selectedIds.has(user.id)}
					onToggleSelect={onToggleSelect}
					onRemove={onRemove}
				/>
			))}
			{users.length === 0 && (
				<div className="col-span-full py-12 text-center text-secondary bg-surface-container-low rounded-lg border border-dashed border-outline-variant">
					No users found in this workspace.
				</div>
			)}
		</div>
	);
}
