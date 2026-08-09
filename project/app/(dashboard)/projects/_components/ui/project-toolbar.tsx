"use client";

import { UserPlus } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/buttons/button";
import { VIEW_TABS } from "../../_constants/project";
import type { ProjectViewType } from "../../[id]/page";

interface ProjectToolbarProps {
	activeView: ProjectViewType;
	onViewChange: (view: ProjectViewType) => void;
	renderFilter?: React.ReactNode;
}

export function ProjectToolbar({
	activeView,
	onViewChange,
	renderFilter,
}: ProjectToolbarProps) {
	return (
		<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
			<div className="flex bg-surface-container-low p-1 rounded-lg border border-outline-variant overflow-x-auto hide-scrollbar">
				{VIEW_TABS.map((tab) => {
					const isActive = activeView === tab.value;

					return (
						<Button
							key={tab.value}
							onClick={() => onViewChange(tab.value)}
							variant="ghost"
							className={`px-4 py-1.5 font-label-md text-label-md rounded-md transition-all whitespace-nowrap h-auto ${
								isActive
									? "bg-surface text-on-surface shadow-sm border border-outline-variant/50 font-semibold hover:bg-surface"
									: "text-secondary hover:text-on-surface hover:bg-surface-variant/50 border border-transparent shadow-none"
							}`}
						>
							{tab.label}
						</Button>
					);
				})}
			</div>

			<div className="flex flex-wrap items-center gap-3 shrink-0">
				{renderFilter}

				<div className="flex items-center gap-2 ml-1 border-l border-outline-variant pl-4">
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
					<Button
						variant="outline"
						size="icon"
						className="w-9 h-9 rounded-full border border-dashed border-outline flex items-center justify-center text-secondary hover:text-on-surface hover:bg-surface-variant transition-colors hover:border-outline-variant"
					>
						<UserPlus size={18} />
					</Button>
				</div>
			</div>
		</div>
	);
}
