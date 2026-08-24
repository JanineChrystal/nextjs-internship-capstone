"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	ChevronDown,
	ChevronRight,
	RefreshCw,
	Save,
	Trash2,
	UserPlus,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/buttons/button";
import { Input } from "@/components/ui/input";
import { MemberAvatar } from "@/components/ui/member-avatar";
import { SectionTitle } from "@/components/ui/sections";
import {
	type SaveGroupFormValues,
	SaveGroupSchema,
} from "@/lib/validations/group-schema";
import { useProjectGroups } from "../../../_hooks/use-project-groups";

interface GroupsSectionProps {
	projectId: string;
	canManage: boolean;
}

/**
 * groups section - manages reusable member snapshots, emphasizing that groups
 * are point-in-time copies rather than live synchronizations.
 */
export function GroupsSection({ projectId, canManage }: GroupsSectionProps) {
	const {
		groups,
		isLoading,
		expandedGroupId,
		groupMembers,
		groupStanding,
		toggleGroup,
		saveAsGroup,
		applyGroup,
		syncGroup,
		removeGroup,
	} = useProjectGroups(projectId);

	// form state separation - separates UI toggles into local state while delegating validated inputs to the form handler.
	const [isNaming, setIsNaming] = useState(false);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<SaveGroupFormValues>({
		resolver: zodResolver(SaveGroupSchema),
		defaultValues: { name: "" },
	});

	const closeNameForm = () => {
		reset();
		setIsNaming(false);
	};

	const onSubmit = handleSubmit(async ({ name }) => {
		const saved = await saveAsGroup(name);
		if (saved) closeNameForm();
	});

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
						<form onSubmit={onSubmit} className="flex flex-col gap-1">
							<div className="flex flex-col sm:flex-row gap-2">
								<Input
									{...register("name")}
									placeholder="Group name (e.g. Design Squad)"
									className="h-10 flex-1"
									aria-invalid={Boolean(errors.name)}
								/>
								<div className="flex gap-2">
									<Button
										type="submit"
										disabled={isSubmitting}
										className="h-10"
									>
										Save group
									</Button>
									<Button
										type="button"
										variant="outline"
										className="h-10"
										onClick={closeNameForm}
									>
										Cancel
									</Button>
								</div>
							</div>
							{errors.name && (
								<p className="text-xs text-error">{errors.name.message}</p>
							)}
						</form>
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
						const { isFullyApplied, isStale } = groupStanding(group);

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
											{/* nothing-to-add guard - hidden when every person in the group is already on this project, which is always true in the project the group was saved from. It reappears here the moment the rosters diverge, and on any other project. */}
											{!isFullyApplied && (
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
											)}
											{/* sync control - the offered alternative to saving a near-identical second group; only shown when it would actually change the roster. */}
											{isStale && (
												<Button
													type="button"
													variant="ghost"
													size="icon-sm"
													onClick={() => syncGroup(group.id)}
													title="Update this group to match the project's current members"
													aria-label={`Sync ${group.name} to this project's members`}
													className="text-secondary hover:text-primary"
												>
													<RefreshCw className="h-4 w-4" />
												</Button>
											)}
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
													<MemberAvatar name={member.name} size="sm" />
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
