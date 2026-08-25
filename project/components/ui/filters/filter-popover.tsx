"use client";

import { ChevronLeft, ChevronRight, ListFilter } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/buttons/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

export interface FilterOption {
	label: string;
	value: string;
}

export interface FilterField {
	id: string;
	label: string;
	options: readonly (string | FilterOption)[];
}

interface FilterPopoverProps {
	fields: FilterField[];
	values: Record<string, string[]>;
	onChange: (fieldId: string, optionValue: string) => void;
	onReset: () => void;
}

export function FilterPopover({
	fields,
	values,
	onChange,
	onReset,
}: FilterPopoverProps) {
	const [activeFieldId, setActiveFieldId] = useState<string | null>(null);

	/** active count - calculates the total number of filter options currently selected across all filter fields. */
	const activeCount = Object.values(values).reduce(
		(count, selectedArray) => count + selectedArray.length,
		0,
	);

	const activeField = fields.find((f) => f.id === activeFieldId);

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="relative h-10 w-10 text-secondary hover:text-on-surface hover:bg-surface-variant transition-colors shrink-0"
					aria-label="Filter"
				>
					<ListFilter size={18} />
					{activeCount > 0 && (
						<span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold rounded-full border-2 border-surface">
							{activeCount}
						</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align="end"
				className="w-64 p-3 bg-surface-container-lowest border-outline-variant"
			>
				{activeFieldId === null ? (
					<>
						<div className="flex items-center justify-between mb-1 border-outline-variant pb-2">
							<h4 className="text-on-surface font-semibold">Filters</h4>
							{activeCount > 0 && (
								<Button
									variant="ghost"
									size="xs"
									className="text-xs text-secondary hover:text-error"
									onClick={onReset}
								>
									Reset All
								</Button>
							)}
						</div>
						<div className="flex flex-col gap-1">
							{fields.map((field) => {
								const selectedCount = values[field.id]?.length || 0;
								return (
									<button
										key={field.id}
										type="button"
										onClick={() => setActiveFieldId(field.id)}
										className="flex items-center justify-between p-2 rounded-md hover:bg-surface-container-low transition-colors text-left"
									>
										<span className="text-sm text-on-surface flex items-center gap-2">
											{field.label}
											{selectedCount > 0 && (
												<span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
													{selectedCount}
												</span>
											)}
										</span>
										<ChevronRight size={16} className="text-secondary" />
									</button>
								);
							})}
						</div>
					</>
				) : (
					<>
						<div className="flex items-center gap-2 mb-3 border-b border-outline-variant pb-2">
							<button
								type="button"
								onClick={() => setActiveFieldId(null)}
								className="p-1 hover:bg-surface-container-low rounded-md text-secondary transition-colors"
							>
								<ChevronLeft size={16} />
							</button>
							<h4 className="text-on-surface font-semibold">
								{activeField?.label}
							</h4>
						</div>
						<div className="flex flex-col gap-1.5 max-h-[60vh] overflow-y-auto hide-scrollbar">
							{activeField?.options.map((opt) => {
								const optionValue = typeof opt === "string" ? opt : opt.value;
								const optionLabel = typeof opt === "string" ? opt : opt.label;
								const isChecked =
									values[activeField.id]?.includes(optionValue) ?? false;

								const checkboxId = `filter-${activeField.id}-${optionValue}`;

								return (
									<label
										key={optionValue}
										htmlFor={checkboxId}
										className="flex items-center gap-2 text-sm text-on-surface hover:bg-surface-container-low p-1.5 rounded cursor-pointer transition-colors"
									>
										<Checkbox
											id={checkboxId}
											checked={isChecked}
											onCheckedChange={() =>
												onChange(activeField.id, optionValue)
											}
											className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
										/>
										<span className="flex-1 truncate">{optionLabel}</span>
									</label>
								);
							})}
						</div>
					</>
				)}
			</PopoverContent>
		</Popover>
	);
}
