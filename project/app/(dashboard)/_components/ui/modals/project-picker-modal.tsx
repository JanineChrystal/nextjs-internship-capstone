"use client";

import { FolderOpen, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { BaseModal } from "@/components/modals/base-modal";
import { Button } from "@/components/ui/buttons/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import type { ProjectPickerOption } from "@/lib/types/dashboard";
import { cn } from "@/lib/utils";

interface ProjectPickerModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSelect: (projectId: string) => void;
	projects: ProjectPickerOption[];
	title: string;
	description: string;
	confirmLabel: string;
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
 * ## Why it does not filter by permission
 *
 * Every project the viewer can reach is listed, including ones where they may
 * not be allowed to complete the action - a member can open this from "Add a
 * member" and pick a project they cannot invite to. The invite is then refused
 * by the server with a message that says so.
 *
 * Hiding those projects would mean sending each one's effective role to the
 * browser just to grey out a row, and the refusal has to exist regardless: the
 * server cannot trust a filtered list it did not produce. Showing everything and
 * letting the real check speak is the same zero-trust rule the rest of the app
 * follows, and it explains itself rather than silently omitting a project the
 * user knows they have.
 */
export function ProjectPickerModal({
	isOpen,
	onClose,
	onSelect,
	projects,
	title,
	description,
	confirmLabel,
	isBusy = false,
}: ProjectPickerModalProps) {
	const [query, setQuery] = useState("");
	const [selectedId, setSelectedId] = useState<string | null>(null);

	// A search box only earns its place once the list is long enough to scan.
	const showSearch = projects.length > 6;

	const visible = useMemo(() => {
		const trimmed = query.trim().toLowerCase();
		if (!trimmed) return projects;
		return projects.filter((project) =>
			project.name.toLowerCase().includes(trimmed),
		);
	}, [projects, query]);

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
						icon={FolderOpen}
						title="No projects yet"
						description="Create a project first, then you can add tasks and members to it."
					/>
				) : visible.length === 0 ? (
					<EmptyState
						icon={Search}
						title="No match"
						description={`Nothing matches "${query.trim()}".`}
					/>
				) : (
					/* A radiogroup rather than a list of buttons: picking a project is
					   choosing one of several, and arrow-key navigation between options
					   comes free from the role. */
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
										aria-pressed={isSelected}
										onClick={() => setSelectedId(project.id)}
										onDoubleClick={() => {
											setSelectedId(project.id);
											onSelect(project.id);
										}}
										className={cn(
											"flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
											isSelected
												? "border-primary bg-primary/5"
												: "border-border bg-surface-container-low hover:bg-surface-container",
										)}
									>
										<FolderOpen
											className={cn(
												"h-4 w-4 shrink-0",
												isSelected ? "text-primary" : "text-secondary",
											)}
											aria-hidden="true"
										/>
										<span className="flex min-w-0 flex-1 flex-col">
											<span className="truncate text-sm font-medium text-on-surface">
												{project.name}
											</span>
											{project.category && (
												<span className="truncate text-xs text-secondary">
													{project.category}
												</span>
											)}
										</span>
										{project.isOwned && (
											<span className="shrink-0 rounded-full bg-surface-container-high px-2 py-0.5 text-xs text-secondary">
												Owner
											</span>
										)}
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
