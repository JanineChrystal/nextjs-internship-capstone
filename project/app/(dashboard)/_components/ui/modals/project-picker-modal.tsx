"use client";

import { FolderOpen, Lock, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { BaseModal } from "@/components/modals/base-modal";
import { Button } from "@/components/ui/buttons/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { hasPermission } from "@/lib/config/permissions";
import type { ProjectPickerOption } from "@/lib/types/dashboard";
import type { Permission } from "@/lib/types/member";
import { cn } from "@/lib/utils";

interface ProjectPickerModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSelect: (projectId: string) => void;
	projects: ProjectPickerOption[];
	title: string;
	description: string;
	confirmLabel: string;
	/** Projects where the viewer lacks this are listed but not selectable. */
	requiredPermission: Permission;
	/** Shown on a disabled row, saying why it cannot be used. */
	deniedHint: string;
	isBusy?: boolean;
}

/**
 * "Which project?" - the step in front of any action that needs one.
 *
 * Two shortcuts on the dashboard need this: creating a task, and adding a member
 * to a project. Both are project-scoped operations reached from a page that has
 * no project, so both have to ask first. Writing it once means the two cannot
 * end up asking the same question in two different shapes.
 *
 * ## Disabled rather than hidden, and never instead of the server check
 *
 * A project the viewer cannot perform this action on is shown, greyed, with the
 * reason beside it. Two deliberate choices there:
 *
 * **Disabled, not hidden.** Someone who knows they are on a project and cannot
 * find it in this list has no way to tell whether it is missing because of their
 * access or because something is broken. A greyed row with "Only the owner or a
 * co-owner can invite" answers that on the spot.
 *
 * **This is not the security boundary.** The server re-checks the same
 * permission when the action runs, and has to: this list is assembled in the
 * browser and nothing stops a caller invoking the action directly. Greying rows
 * out is purely so a refusal never arrives after someone has filled in a form.
 * The two read the same `Permission` value, so they cannot drift into disagreeing
 * about which projects are usable.
 */
export function ProjectPickerModal({
	isOpen,
	onClose,
	onSelect,
	projects,
	title,
	description,
	confirmLabel,
	requiredPermission,
	deniedHint,
	isBusy = false,
}: ProjectPickerModalProps) {
	const [query, setQuery] = useState("");
	const [selectedId, setSelectedId] = useState<string | null>(null);

	// A search box only earns its place once the list is long enough to scan.
	const showSearch = projects.length > 6;

	const options = useMemo(
		() =>
			projects.map((project) => ({
				...project,
				isAllowed: hasPermission(project.roleAccess, requiredPermission),
			})),
		[projects, requiredPermission],
	);

	const visible = useMemo(() => {
		const trimmed = query.trim().toLowerCase();
		if (!trimmed) return options;
		return options.filter((project) =>
			project.name.toLowerCase().includes(trimmed),
		);
	}, [options, query]);

	const allowedCount = options.filter((project) => project.isAllowed).length;

	const handleClose = () => {
		setQuery("");
		setSelectedId(null);
		onClose();
	};

	const handleConfirm = () => {
		if (!selectedId) return;
		onSelect(selectedId);
		setQuery("");
		setSelectedId(null);
	};

	return (
		<BaseModal
			isOpen={isOpen}
			onClose={handleClose}
			title={title}
			maxWidth="lg"
		>
			<div className="flex flex-col gap-4 p-6">
				<p className="text-sm text-secondary">{description}</p>

				{showSearch && (
					<div className="relative">
						<Search
							className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary"
							aria-hidden="true"
						/>
						<Input
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Search projects"
							className="pl-9"
							aria-label="Search projects"
						/>
					</div>
				)}

				{projects.length === 0 ? (
					<EmptyState
						subdued
						icon={FolderOpen}
						title="No projects yet"
						description="Create a project first, then you can add tasks and members to it."
					/>
				) : allowedCount === 0 ? (
					/* Every project is listed but none can be used. Saying so once at
					   the top is clearer than leaving someone to work it out from a
					   list where every row happens to be greyed. */
					<EmptyState
						subdued
						icon={Lock}
						title="No project you can do this on"
						description={`You have access to ${projects.length} ${projects.length === 1 ? "project" : "projects"}, but not at a level that allows this.`}
					/>
				) : visible.length === 0 ? (
					<EmptyState
						subdued
						icon={Search}
						title="No match"
						description={`Nothing matches "${query.trim()}".`}
					/>
				) : (
					<ul
						className="flex max-h-72 flex-col gap-1 overflow-y-auto"
						aria-label="Projects"
					>
						{visible.map((project) => {
							const isSelected = selectedId === project.id;
							return (
								<li key={project.id}>
									<button
										type="button"
										disabled={!project.isAllowed}
										aria-pressed={isSelected}
										// The reason travels with the control rather than
										// only being printed beside it, so it is announced
										// when the row is reached rather than needing to be
										// found separately.
										aria-description={
											project.isAllowed ? undefined : deniedHint
										}
										onClick={() => setSelectedId(project.id)}
										onDoubleClick={() => {
											if (!project.isAllowed) return;
											setSelectedId(project.id);
											onSelect(project.id);
										}}
										className={cn(
											"flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
											!project.isAllowed &&
												"cursor-not-allowed border-border bg-surface-container-low/50 opacity-60",
											project.isAllowed &&
												(isSelected
													? "border-primary bg-primary/5"
													: "border-border bg-surface-container-low hover:bg-surface-container"),
										)}
									>
										{project.isAllowed ? (
											<FolderOpen
												className={cn(
													"h-4 w-4 shrink-0",
													isSelected ? "text-primary" : "text-secondary",
												)}
												aria-hidden="true"
											/>
										) : (
											<Lock
												className="h-4 w-4 shrink-0 text-secondary"
												aria-hidden="true"
											/>
										)}

										<span className="flex min-w-0 flex-1 flex-col">
											<span className="truncate text-sm font-medium text-on-surface">
												{project.name}
											</span>
											<span className="truncate text-xs text-secondary">
												{project.isAllowed ? project.category : deniedHint}
											</span>
										</span>

										<span className="shrink-0 rounded-full bg-surface-container-high px-2 py-0.5 text-xs capitalize text-secondary">
											{project.roleAccess}
										</span>
									</button>
								</li>
							);
						})}
					</ul>
				)}

				<div className="flex justify-end gap-3 border-t border-border pt-4">
					<Button type="button" variant="outline" onClick={handleClose}>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={handleConfirm}
						disabled={!selectedId || isBusy}
					>
						{isBusy ? "Loading..." : confirmLabel}
					</Button>
				</div>
			</div>
		</BaseModal>
	);
}
