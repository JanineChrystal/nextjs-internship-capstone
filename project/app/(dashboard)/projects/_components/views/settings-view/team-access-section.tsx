"use client";

import { Globe, Lock, Trash2, Users } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/buttons/button";
import { Input } from "@/components/ui/input";
import { SectionTitle } from "@/components/ui/sections";
import { GridTable } from "@/components/views/grid-table/grid-table";
import type { RoleAccess } from "@/types/member";
import {
	settingsSectionTexts,
	TEAM_ACCESS_COLUMNS,
} from "../../../_constants/settings-view";
import { useTeamAccess } from "../../../_hooks/use-team-access";

interface TeamAccessSectionProps {
	projectId: string;
	currentUserRole: RoleAccess;
}

export function TeamAccessSection({
	projectId,
	currentUserRole,
}: TeamAccessSectionProps) {
	const {
		members,
		isPublic,
		canManageMembers,
		handleRoleChange,
		handleJobRoleChange,
		handleToggleVisibility,
		handleRemoveMember,
	} = useTeamAccess(projectId, currentUserRole);

	return (
		<section className="bg-surface rounded-xl border border-outline-variant p-6 flex flex-col gap-6">
			<SectionTitle
				title={settingsSectionTexts.teamAccess.title}
				description={settingsSectionTexts.teamAccess.description}
			/>

			{currentUserRole === "guest" && (
				<div className="bg-primary/10 border border-primary/20 text-primary p-4 rounded-lg text-sm">
					Need higher access? Contact the project owner or ask a Co-Owner to
					update your role.
				</div>
			)}

			<div className="flex items-center justify-between p-4 bg-surface-container-lowest border border-outline-variant rounded-lg">
				<div className="flex items-center gap-3">
					{isPublic ? (
						<Globe className="text-primary" size={24} />
					) : (
						<Lock className="text-secondary" size={24} />
					)}
					<div>
						<h3 className="font-semibold text-on-surface">
							{isPublic ? "Public Access" : "Restricted Access"}
						</h3>
						<p className="text-xs text-secondary">
							{isPublic
								? "Anyone with the link can view this project as a guest."
								: "Only invited members can access this project."}
						</p>
					</div>
				</div>
				{canManageMembers && (
					<button
						type="button"
						onClick={handleToggleVisibility}
						className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
							isPublic ? "bg-primary" : "bg-surface-variant"
						}`}
					>
						<span
							className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
								isPublic ? "translate-x-6" : "translate-x-1"
							}`}
						/>
					</button>
				)}
			</div>

			<GridTable
				data={members}
				columns={TEAM_ACCESS_COLUMNS}
				keyExtractor={(member) => member.userId}
				renderEmptyState={() => (
					<div className="flex flex-col items-center justify-center py-10 border-t border-dashed border-outline-variant bg-surface-container-lowest">
						<Users size={48} className="text-secondary/50 mb-4" />
						<h3 className="text-lg font-semibold text-on-surface">
							No team members found
						</h3>
						<p className="text-sm text-secondary">
							Invite users to collaborate on this project.
						</p>
					</div>
				)}
				renderRow={(member) => {
					const isOwner = member.roleAccess === "owner";
					const canEditRow = canManageMembers && !isOwner;

					return (
						<>
							<div className="flex-2 min-w-50">
								<div className="flex items-center gap-3">
									{member.avatarUrl ? (
										<Image
											src={member.avatarUrl}
											alt={member.name}
											width={32}
											height={32}
											className="rounded-full bg-surface-variant shrink-0"
										/>
									) : (
										<div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0">
											{member.name.charAt(0)}
										</div>
									)}
									<div>
										<p className="font-medium text-on-surface text-sm">
											{member.name}
										</p>
										<p className="text-xs text-secondary">{member.email}</p>
									</div>
								</div>
							</div>
							<div className="w-44">
								{canEditRow ? (
									<Input
										value={member.jobRole}
										onChange={(e) =>
											handleJobRoleChange(member.userId, e.target.value)
										}
										className="h-8 text-sm bg-transparent border-transparent hover:border-outline-variant focus-visible:border-primary w-full max-w-36"
									/>
								) : (
									<span className="text-on-surface px-3 py-1 text-sm">
										{member.jobRole}
									</span>
								)}
							</div>
							<div className="w-44">
								{canEditRow ? (
									<select
										value={member.roleAccess}
										onChange={(e) =>
											handleRoleChange(
												member.userId,
												e.target.value as RoleAccess,
											)
										}
										className="h-8 px-2 bg-transparent border border-transparent hover:border-outline-variant focus:border-primary rounded text-sm text-on-surface cursor-pointer focus:outline-none w-32"
									>
										<option value="co-owner">Co-Owner</option>
										<option value="member">Member</option>
										<option value="guest">Guest</option>
									</select>
								) : (
									<span className="px-2 py-1 text-xs font-semibold uppercase bg-surface-variant text-on-surface rounded inline-block">
										{member.roleAccess}
									</span>
								)}
							</div>
							<div className="w-32">
								<span
									className={`px-2.5 py-0.5 text-xs font-medium rounded-full border inline-block capitalize ${
										(member.status || "joined") === "invited"
											? "text-amber-700 bg-amber-100 border-amber-200 dark:text-amber-300 dark:bg-amber-900/30 dark:border-amber-800/30"
											: "text-emerald-700 bg-emerald-100 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800/30"
									}`}
								>
									{member.status || "joined"}
								</span>
							</div>
							<div className="w-16 flex justify-end">
								{canEditRow && (
									<Button
										variant="ghost"
										size="sm"
										type="button"
										onClick={() => handleRemoveMember(member.userId)}
										className="text-error hover:text-error hover:bg-error/10 h-8 px-2"
									>
										<Trash2 size={16} />
										<span className="sr-only">Remove</span>
									</Button>
								)}
							</div>
						</>
					);
				}}
			/>
		</section>
	);
}
