"use client";

import { Plus } from "lucide-react";
import { Toolbar } from "@/app/(dashboard)/_components/ui/toolbar/toolbar";
import { Button } from "@/components/ui/buttons/button";
import {
	type FilterField,
	FilterPopover,
} from "@/components/ui/filters/filter-popover";

export interface ProjectsListToolbarProps {
	onCreateProject: () => void;
	filters: {
		fields: FilterField[];
		values: Record<string, string[]>;
		onChange: (id: string, value: string) => void;
		onReset: () => void;
	};
}

export function ProjectsListToolbar({
	onCreateProject,
	filters,
}: ProjectsListToolbarProps) {
	return (
		<Toolbar
			leftSection={
				<Button className="w-full sm:w-auto ml-2" onClick={onCreateProject}>
					<Plus className="w-4 h-4 mr-2" />
					Create New Project
				</Button>
			}
			rightSection={
				<FilterPopover
					fields={filters.fields}
					values={filters.values}
					onChange={filters.onChange}
					onReset={filters.onReset}
				/>
			}
		/>
	);
}
