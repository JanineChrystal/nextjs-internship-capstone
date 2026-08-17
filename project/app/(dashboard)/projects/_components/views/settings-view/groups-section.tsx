"use client";

import {
	ChevronDown,
	ChevronRight,
	Save,
	Trash2,
	UserPlus,
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/buttons/button";
import { Input } from "@/components/ui/input";
import { SectionTitle } from "@/components/ui/sections";
import { useProjectGroups } from "../../../_hooks/use-project-groups";

interface GroupsSectionProps {
	projectId: string;
	canManage: boolean;
}

/**
 * Reusable member groups, managed entirely from project settings.
 *
 * A group is a saved snapshot of people, not a live link: "Add from group"
 * copies its members into this project as ordinary members, and editing or
 * deleting the group afterwards leaves this project untouched. That is stated in
 * the UI too, because the alternative behaviour is what users normally assume.
 */
export function GroupsSection({ projectId, canManage }: GroupsSectionProps) {
	const {
		groups,
		isLoading,
		expandedGroupId,
		groupMembers,
		toggleGroup,
		saveAsGroup,
		applyGroup,
		removeGroup,
	} = useProjectGroups(projectId);

	const [isNaming, setIsNaming] = useState(false);
	const [groupName, setGroupName] = useState("");

	const handleSave = async () => {
		if (!groupName.trim()) return;
		const saved = await saveAsGroup(groupName.trim());
		if (saved) {
			setGroupName("");
			setIsNaming(false);
		}
	};

	return (
		<section className="bg-surface rounded-xl border border-outline-variant p-6 flex flex-col gap-6">
			<SectionTitle
				title="Member Groups"
				description="Save this project's members as a reusable group, or add everyone from a group you saved earlier."
			/>

			<div className="rounded-lg border border-dashed border-outline-variant bg-surface-container-lowest p-4 text-xs text-secondary">
				A group is a saved list of people. Adding one copies its members into
				this project - it does not link them, so editing or deleting a group
				later never changes who can access this project.
			</div>

			{canManage && (
				<div className="flex flex-col gap-3">
					{isNaming ? (
						<div className="flex flex-col sm:flex-row gap-2">
							<Input
								value={groupName}
								onChange={(e) => setGroupName(e.target.value)}
								placeholder="Group name (e.g. Design Squad)"
								className="h-10 flex-1"
							/>
							<div className="flex gap-2">
								<Button type="button" onClick={handleSave} className="h-10">
									Save group
								</Button>
								<Button
									type="button"
									variant="outline"
									className="h-10"
									onClick={() => {
										setIsNaming(false);
										setGroupName("");
									}}
								>
									Cancel
								</Button>
							</div>
						</div>
					) : (
						<Button
							type="button"
							variant="outline"
							onClick={() => setIsNaming(true)}
							className="h-10 gap-2 self-start"
						>
							<Save className="h-4 w-4" />
							Save current members as a group
						</Button>
					)}
				</div>
			)}

			{isLoading ? (
				<p className="text-sm text-secondary">Loading groups...</p>
			) : groups.length === 0 ? (
				<p className="text-sm text-secondary">
					No groups yet. Save this project's members as a group to reuse them on
					your next project.
				</p>
			) : (
				<ul className="flex flex-col gap-2">
					{groups.map((group) => {
						const isExpanded = expandedGroupId === group.id;

						return (
							<li
								key={group.id}
								className="rounded-lg border border-outline-variant bg-surface-container-lowest"
							>
								<div className="flex items-center gap-3 p-3">
									<Button
										type="button"
										variant="ghost"
										size="icon-sm"
										onClick={() => toggleGroup(group.id)}
										aria-label={isExpanded ? "Collapse group" : "Expand group"}
										className="text-secondary"
									>
										{isExpanded ? (
											<ChevronDown className="h-4 w-4" />
										) : (
											<ChevronRight className="h-4 w-4" />
										)}
									</Button>

									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium text-on-surface truncate">
											{group.name}
										</p>
										<p className="text-xs text-secondary">
											{group.memberCount} member
											{group.memberCount === 1 ? "" : "s"}
										</p>
									</div>

									{canManage && (
										<>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => applyGroup(group.id)}
												className="h-8 gap-2"
											>
												<UserPlus className="h-4 w-4" />
												Add to project
											</Button>
											<Button
												type="button"
												variant="ghost"
												size="icon-sm"
												onClick={() => removeGroup(group.id)}
												aria-label={`Delete ${group.name}`}
												className="text-secondary hover:text-error"
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</>
									)}
								</div>

								{isExpanded && (
									<ul className="border-t border-outline-variant px-3 py-2 flex flex-col gap-2">
										{groupMembers.length === 0 ? (
											<li className="text-xs text-secondary py-1">
												This group has no members.
											</li>
										) : (
											groupMembers.map((member) => (
												<li
													key={member.id}
													className="flex items-center gap-3 py-1"
												>
													<Avatar className="h-7 w-7 shrink-0">
														<AvatarFallback className="text-xs">
															{member.name.charAt(0).toUpperCase()}
														</AvatarFallback>
													</Avatar>
													<div className="min-w-0">
														<p className="text-sm text-on-surface truncate">
															{member.name}
														</p>
														<p className="text-xs text-secondary truncate">
															{member.email}
														</p>
													</div>
												</li>
											))
										)}
									</ul>
								)}
							</li>
						);
					})}
				</ul>
			)}
		</section>
	);
}
