"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { TagBadge } from "@/app/(dashboard)/_components/ui/badges/tag-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/buttons/button";
import { Checkbox } from "@/components/ui/checkbox";
import { GridTable } from "@/components/views/grid-table/grid-table";
import type { WorkspaceMemberOutputDTO } from "@/lib/dtos/workspace-member-dto";
import type { ColumnDef } from "@/lib/types/grid-table";
import { DIRECTORY_COLUMNS } from "../../_constants/directory-columns";

interface GridViewProps {
	users: WorkspaceMemberOutputDTO[];
	selectedIds: Set<string>;
	onToggleSelect: (userId: string) => void;
	onSelectAll: (checked: boolean) => void;
	onRemove: (userId: string) => void;
	sortConfig: { key: string; direction: "asc" | "desc" } | null;
	onSort: (key: string) => void;
}

export function GridView({
	users,
	selectedIds,
	onToggleSelect,
	onSelectAll,
	onRemove,
	sortConfig,
	onSort,
}: GridViewProps) {
	const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
	const isSelectionActive = isSelectionModeActive || selectedIds.size > 0;

	// Only the select header depends on state, so the static definitions are
	// reused and just that one column is rebuilt when selection mode changes.
	const columns = useMemo<ColumnDef[]>(
		() =>
			DIRECTORY_COLUMNS.map((column) =>
				column.key === "select"
					? {
							...column,
							renderHeader: () => (
								<Checkbox
									checked={isSelectionActive}
									onCheckedChange={(c) => {
										const checked = Boolean(c);
										setIsSelectionModeActive(checked);
										if (!checked) {
											onSelectAll(false);
										}
									}}
									aria-label="Toggle selection mode"
								/>
							),
						}
					: column,
			),
		[isSelectionActive, onSelectAll],
	);

	return (
		<div className="mt-6 w-full relative">
			<GridTable
				data={users}
				columns={columns}
				sortConfig={sortConfig}
				onSort={onSort}
				keyExtractor={(user) => user.id}
				renderRow={(user) => {
					const isSelected = selectedIds.has(user.id);
					return (
						<>
							<div className="w-12 flex-none">
								<Checkbox
									checked={isSelected}
									onCheckedChange={() => onToggleSelect(user.id)}
									className={`transition-opacity duration-150 ${isSelectionActive ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
								/>
							</div>

							<Link
								href={`/profile/${user.id}`}
								className="flex flex-1 items-center gap-4 min-w-0"
							>
								<div className="flex-2 flex items-center gap-3 overflow-hidden">
									<Avatar className="h-8 w-8 shrink-0">
										<AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
											{user.name.slice(0, 2).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<span className="font-medium text-sm text-foreground truncate">
										{user.name}
									</span>
								</div>

								<div className="flex-2 text-sm text-secondary truncate">
									{user.email}
								</div>

								<div className="flex-2 flex items-center gap-2 flex-wrap">
									{user.jobRoles.map((role) => (
										<TagBadge key={role} tag={role} />
									))}
								</div>

								<div className="flex-1 text-center text-sm font-medium text-foreground">
									{user.projectCount}
								</div>
							</Link>

							<div className="w-12 flex-none flex justify-end">
								<Button
									type="button"
									variant="ghost"
									size="icon"
									onClick={() => onRemove(user.id)}
									className="h-8 w-8 text-secondary hover:text-error hover:bg-error/10 transition-colors"
									aria-label="Remove user from workspace"
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
						</>
					);
				}}
				renderEmptyState={() => (
					<div className="py-12 text-center text-secondary">
						No users found in this workspace.
					</div>
				)}
			/>
		</div>
	);
}
