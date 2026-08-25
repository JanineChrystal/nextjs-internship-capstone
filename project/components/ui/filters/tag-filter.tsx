"use client";

import { ArrowLeft, Plus, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/buttons/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { FilterChip } from "./filter-chip";

// data interfaces - definitions reused across filter components to standardize filter data structures.
export interface FilterOption {
	value: string;
	label: string;
}
export interface FilterDefinition {
	key: string;
	label: string;
	options: FilterOption[];
}
export interface ActiveFilter {
	key: string;
	keyLabel: string;
	value: string;
	valueLabel: string;
}

interface TagFilterProps {
	filterDefinitions: FilterDefinition[];
	activeFilters: ActiveFilter[];
	onAddFilter: (filter: ActiveFilter) => void;
	onRemoveFilter: (key: string) => void;
	onReset: () => void;
}

export function TagFilter({
	filterDefinitions,
	activeFilters,
	onAddFilter,
	onRemoveFilter,
	onReset,
}: TagFilterProps) {
	const [open, setOpen] = useState(false);
	const [selectedDef, setSelectedDef] = useState<FilterDefinition | null>(null);

	const handleSelectValue = (def: FilterDefinition, option: FilterOption) => {
		onAddFilter({
			key: def.key,
			keyLabel: def.label,
			value: option.value,
			valueLabel: option.label,
		});
		setOpen(false);
		setSelectedDef(null);
	};

	return (
		<div className="flex flex-wrap items-center gap-2">
			{/* add filter popover - displays the dropdown interface for selecting new filter categories and options. */}
			<Popover
				open={open}
				onOpenChange={(isOpen) => {
					setOpen(isOpen);
					if (!isOpen)
						setSelectedDef(
							null,
						); /** view reset - clears the selected category view when the popover is closed. */
				}}
			>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						size="sm"
						className="h-8 rounded-full border-dashed border-2"
					>
						<Plus className="w-4 h-4 mr-1" />
						Add filter
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className="w-64 p-3 bg-popover text-popover-foreground border-border rounded-xl"
					align="start"
				>
					{/* category selection view - renders the initial list of available filter categories to choose from. */}
					{!selectedDef && (
						<div className="flex flex-col gap-1">
							<p className="text-xs font-semibold text-card-foreground/60 uppercase mb-2">
								Filter by
							</p>
							{filterDefinitions.map((def) => (
								<Button
									key={def.key}
									variant="ghost"
									size="sm"
									className="justify-start font-medium"
									onClick={() => setSelectedDef(def)}
								>
									{def.label}
								</Button>
							))}
						</div>
					)}

					{/* option selection view - renders the list of selectable options for the currently chosen filter category. */}
					{selectedDef && (
						<div className="flex flex-col gap-1">
							<div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
								<Button
									variant="ghost"
									size="icon"
									className="w-6 h-6"
									onClick={() => setSelectedDef(null)}
								>
									<ArrowLeft className="w-3 h-3" />
								</Button>
								<p className="text-xs font-semibold uppercase">
									{selectedDef.label}
								</p>
							</div>
							{selectedDef.options.map((option) => (
								<Button
									key={option.value}
									variant="ghost"
									size="sm"
									className="justify-start text-sm"
									onClick={() => handleSelectValue(selectedDef, option)}
								>
									{option.label}
								</Button>
							))}
						</div>
					)}
				</PopoverContent>
			</Popover>

			{/* active filters list - iterates over and renders chips for all currently applied filters. */}
			{activeFilters.map((filter) => (
				<FilterChip
					key={filter.key}
					label={`${filter.keyLabel}: ${filter.valueLabel}`}
					isActive={true}
					onRemove={() => onRemoveFilter(filter.key)}
				/>
			))}

			{/* reset control - provides a quick action to clear all active filters at once. */}
			{activeFilters.length > 0 && (
				<Button
					variant="ghost"
					size="icon"
					onClick={onReset}
					className="h-8 w-8 rounded-full"
					title="Reset filters"
				>
					<RefreshCw className="w-4 h-4 text-card-foreground/60" />
				</Button>
			)}
		</div>
	);
}
