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
	/** required permission - determines if a listed project is selectable or disabled based on user access. */
	requiredPermission: Permission;
	/** denied hint - explanatory text displayed on disabled project rows. */
	deniedHint: string;
	isBusy?: boolean;
}

/**
 * project picker modal - a reusable modal for selecting a project before performing project-scoped actions from global contexts.
 * projects lacking required permissions are shown as disabled rather than hidden to provide clear feedback, while actual security validation remains on the server.
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

	// search visibility threshold - only display search when the list exceeds a scannable length.
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
					/* zero-access empty state - displays a clear top-level message when all listed projects are disabled due to permissions. */
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
										// accessible disabled reason - associates the denial hint directly with the button for screen readers.
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
