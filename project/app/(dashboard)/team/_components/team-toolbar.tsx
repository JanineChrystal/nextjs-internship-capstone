"use client";

import { ArrowDownAZ, ArrowUpZA, Filter, UserPlus } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Toolbar, ViewTabs } from "@/app/(dashboard)/_components/ui/toolbar";
import { Button } from "@/components/ui/buttons/button";
import type { TeamViewType } from "@/lib/types/team";

const AddMemberModal = dynamic(
	() =>
		import("@/app/(dashboard)/_components/ui/modals/add-member-modal").then(
			(m) => m.AddMemberModal,
		),
	{ ssr: false },
);

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TEAM_VIEWS } from "../_constants/team-views";

interface TeamToolbarProps {
	activeView?: TeamViewType;
	onViewChange?: (view: TeamViewType) => void;
	onToggleSort?: () => void;
	availableRoles?: string[];
	// invites settled callback - triggers a directory refresh when the add-member modal closes to pick up new invitations.
	onInvitesSettled?: () => void;
}

export const TeamToolbar = ({
	activeView = "Grid",
	onViewChange = () => {},
	onToggleSort,
	availableRoles = [],
	onInvitesSettled,
}: TeamToolbarProps) => {
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [sortAsc, setSortAsc] = useState(true);

	const handleSortClick = () => {
		setSortAsc((prev) => !prev);
		onToggleSort?.();
	};

	return (
		<div className="mb-6">
			<Toolbar
				leftSection={
					<ViewTabs
						tabs={TEAM_VIEWS}
						activeView={activeView}
						onViewChange={onViewChange}
					/>
				}
				rightSection={
					<>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="h-9 gap-2 text-secondary hover:text-on-surface"
								>
									<Filter className="h-4 w-4" />
									Roles
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="w-48 bg-surface border-outline-variant"
							>
								{availableRoles.length > 0 ? (
									availableRoles.map((role) => (
										<DropdownMenuItem
											key={role}
											className="cursor-pointer text-sm text-foreground focus:bg-surface-container-high"
										>
											{role}
										</DropdownMenuItem>
									))
								) : (
									<DropdownMenuItem disabled className="text-sm text-secondary">
										No roles found
									</DropdownMenuItem>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
						{activeView === "Board" && (
							<Button
								type="button"
								variant="outline"
								size="icon"
								className="h-9 w-9 text-secondary hover:text-on-surface"
								onClick={handleSortClick}
								aria-label="Toggle sort order"
							>
								{sortAsc ? (
									<ArrowDownAZ className="h-4 w-4" />
								) : (
									<ArrowUpZA className="h-4 w-4" />
								)}
							</Button>
						)}
						<Button
							type="button"
							onClick={() => setIsAddModalOpen(true)}
							className="h-9 gap-2"
						>
							<UserPlus className="h-4 w-4" />
							Add User
						</Button>
					</>
				}
			/>

			{/* implicit scope resolution - relies on the server to determine the workspace ID for invites, requiring no target ID here. */}
			<AddMemberModal
				open={isAddModalOpen}
				onOpenChange={(open) => {
					setIsAddModalOpen(open);
					if (!open) onInvitesSettled?.();
				}}
				scope="workspace"
			/>
		</div>
	);
};
