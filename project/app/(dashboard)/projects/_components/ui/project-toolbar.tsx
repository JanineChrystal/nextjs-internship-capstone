// src/app/(dashboard)/projects/[id]/_components/ui/project-toolbar.tsx
"use client";

import { Filter, Plus, UserPlus } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/buttons/button";
import type { ProjectViewType } from "../../[id]/page";

interface ProjectToolbarProps {
	activeView: ProjectViewType;
	onViewChange: (view: ProjectViewType) => void;
}

const VIEW_TABS: { label: string; value: ProjectViewType }[] = [
	{ label: "Grid", value: "grid" },
	{ label: "Board", value: "board" },
	{ label: "Calendar", value: "calendar" },
	{ label: "Charts", value: "charts" },
	{ label: "Settings", value: "settings" },
];

export function ProjectToolbar({
	activeView,
	onViewChange,
}: ProjectToolbarProps) {
	return (
		// Container for the entire toolbar row
		<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-stack-md w-full">
			<div className="flex bg-surface-container-low p-1 rounded-lg border border-outline-variant overflow-x-auto hide-scrollbar">
				{VIEW_TABS.map((tab) => {
					const isActive = activeView === tab.value;

					return (
						<Button
							key={tab.value}
							onClick={() => onViewChange(tab.value)}
							// Apply dynamic classes based on whether the tab is active
							className={`px-4 py-1.5 font-label-md text-label-md rounded-md transition-colors whitespace-nowrap ${
								isActive
									? "bg-surface text-primary shadow-sm border border-outline-variant/50"
									: "text-secondary hover:text-on-surface"
							}`}
						>
							{tab.label}
						</Button>
					);
				})}
			</div>

			<div className="flex flex-wrap items-center gap-3 shrink-0">
				<Button
					variant="outline"
					className="h-10 px-4 flex items-center gap-2 bg-surface border-outline-variant text-on-surface hover:bg-surface-variant transition-colors"
				>
					<Filter size={18} />
					Filters
				</Button>
				<Button className="h-10 px-5 flex items-center gap-2">
					<Plus size={18} />
					Create Task
				</Button>
				<div className="flex items-center gap-2 ml-2 border-l border-outline-variant pl-4">
					<div className="flex -space-x-3">
						<Image
							alt="Member 1"
							src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
							width={36}
							height={36}
							className="rounded-full border-2 border-surface object-cover z-3 bg-surface-container-low"
						/>
						<Image
							alt="Member 2"
							src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka"
							width={36}
							height={36}
							className="rounded-full border-2 border-surface object-cover z-2 bg-surface-container-low"
						/>
						<div className="w-9 h-9 rounded-full border-2 border-surface bg-surface-variant flex items-center justify-center font-label-sm text-label-sm text-secondary z-0">
							+4
						</div>
					</div>
					<Button className="w-9 h-9 rounded-full border border-dashed border-outline-variant flex items-center justify-center text-secondary hover:bg-surface-variant transition-colors">
						<UserPlus size={18} />
					</Button>
				</div>
			</div>
		</div>
	);
}
