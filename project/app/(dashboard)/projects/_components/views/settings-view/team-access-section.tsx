"use client";

import { Globe, Lock, Trash2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/buttons/button";
import { Input } from "@/components/ui/input";
import { useMemberStore } from "@/stores/use-member-store";
import type { RoleAccess } from "@/types/member";

interface TeamAccessSectionProps {
	projectId: string;
	currentUserRole: RoleAccess; // Assuming we pass the current user's role
}

export function TeamAccessSection({
	projectId,
	currentUserRole,
}: TeamAccessSectionProps) {
	const {
		projectMembers,
		isProjectPublic,
		toggleProjectVisibility,
		updateMemberRoleAccess,
		updateMemberJobRole,
		removeMember,
	} = useMemberStore();

	const members = projectMembers[projectId] || [];
	const isPublic = isProjectPublic[projectId] || false;

	const canManageMembers =
		currentUserRole === "owner" || currentUserRole === "co-owner";

	const handleRoleChange = (userId: string, newRole: RoleAccess) => {
		updateMemberRoleAccess(projectId, userId, newRole);
	};

	const handleJobRoleChange = (userId: string, newJobRole: string) => {
		updateMemberJobRole(projectId, userId, newJobRole);
	};

	return (
		<section className="bg-surface rounded-xl border border-outline-variant p-6 flex flex-col gap-6">
			<div>
				<h2 className="text-xl font-bold text-on-surface">Team & Access</h2>
				<p className="text-sm text-secondary">
					Manage who has access to this project and their permissions.
				</p>
			</div>

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
						onClick={() => toggleProjectVisibility(projectId, !isPublic)}
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

			<div className="border border-outline-variant rounded-lg overflow-x-auto">
				<table className="w-full text-sm text-left whitespace-nowrap">
					<thead className="bg-surface-container-lowest border-b border-outline-variant text-secondary text-xs uppercase">
						<tr>
							<th className="px-4 py-3 font-medium">Member</th>
							<th className="px-4 py-3 font-medium">Position</th>
							<th className="px-4 py-3 font-medium">Access Level</th>
							<th className="px-4 py-3 font-medium text-right">Actions</th>
						</tr>
					</thead>
					<tbody>
						{members.map((member) => {
							const isOwner = member.roleAccess === "owner";
							const canEditRow = canManageMembers && !isOwner;

							return (
								<tr
									key={member.userId}
									className="border-b border-outline-variant last:border-0 hover:bg-surface-variant/30"
								>
									<td className="px-4 py-3">
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
												<p className="font-medium text-on-surface">
													{member.name}
												</p>
												<p className="text-xs text-secondary">{member.email}</p>
											</div>
										</div>
									</td>
									<td className="px-4 py-3">
										{canEditRow ? (
											<Input
												value={member.jobRole}
												onChange={(e) =>
													handleJobRoleChange(member.userId, e.target.value)
												}
												className="h-8 text-sm bg-transparent border-transparent hover:border-outline-variant focus-visible:border-primary w-full min-w-30"
											/>
										) : (
											<span className="text-on-surface px-3 py-1">
												{member.jobRole}
											</span>
										)}
									</td>
									<td className="px-4 py-3">
										{canEditRow ? (
											<select
												value={member.roleAccess}
												onChange={(e) =>
													handleRoleChange(
														member.userId,
														e.target.value as RoleAccess,
													)
												}
												className="h-8 px-2 bg-transparent border border-transparent hover:border-outline-variant focus:border-primary rounded text-sm text-on-surface cursor-pointer focus:outline-none"
											>
												<option value="co-owner">Co-Owner</option>
												<option value="member">Member</option>
												<option value="guest">Guest</option>
											</select>
										) : (
											<span className="px-2 py-1 text-xs font-semibold uppercase bg-surface-variant text-on-surface rounded">
												{member.roleAccess}
											</span>
										)}
									</td>
									<td className="px-4 py-3 text-right">
										{canEditRow && (
											<Button
												variant="ghost"
												size="sm"
												onClick={() => removeMember(projectId, member.userId)}
												className="text-error hover:text-error hover:bg-error/10 h-8 px-2"
											>
												<Trash2 size={16} />
												<span className="sr-only">Remove</span>
											</Button>
										)}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</section>
	);
}
