"use client";

import { PlusIcon, Settings2Icon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxGroup,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	ComboboxSeparator,
} from "@/components/ui/combobox";

/** command sentinel - a unique constant representing the 'Manage Categories' action, never saved as a real value. */
const MANAGE_ACTION_VALUE = "MANAGE_CATEGORIES_ACTION";

export interface CreatableComboboxOption {
	value: string;
	label: string;
	color?: string;
}

interface CreatableComboboxProps {
	options: CreatableComboboxOption[];
	value?: string;
	onChange: (value: string) => void;
	placeholder?: string;
	onManageClick?: () => void;
	disabled?: boolean;
}

export function CreatableCombobox({
	options,
	value,
	onChange,
	placeholder = "Select or create...",
	onManageClick,
	disabled = false,
}: CreatableComboboxProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [inputValue, setInputValue] = useState(value || "");

	useEffect(() => {
		if (value !== undefined) {
			setInputValue(value || "");
		}
	}, [value]);

	const isCreating =
		inputValue.trim().length > 0 &&
		!options.some(
			(opt) => opt.label.toLowerCase() === inputValue.trim().toLowerCase(),
		);

	const handleValueChange = (val: string | null) => {
		if (val === MANAGE_ACTION_VALUE) {
			onManageClick?.();
			/** preserve input - retains the typed text when the user clicks the manage action instead of clearing it. */
			setInputValue(value || "");
			return;
		}
		if (val !== null) {
			setInputValue(val);
			onChange(val);
		}
	};

	/** blur commit handler - ensures typed values are saved when the user clicks away from the field without explicitly selecting the 'Create' option. */
	const handleInputBlur = (event: React.FocusEvent<HTMLInputElement>) => {
		if (containerRef.current?.contains(event.relatedTarget as Node)) return;

		const trimmed = inputValue.trim();

		/** sentinel guard - prevents the 'Manage Categories' command ID from being accidentally saved as a real category name if the user blurs while it is highlighted. */
		if (trimmed === MANAGE_ACTION_VALUE) {
			setInputValue(value || "");
			return;
		}

		if (trimmed && trimmed !== (value || "")) {
			setInputValue(trimmed);
			onChange(trimmed);
		} else if (!trimmed) {
			setInputValue(value || "");
		}
	};

	return (
		<div ref={containerRef} className="relative w-full">
			<Combobox
				disabled={disabled}
				value={value || null}
				onValueChange={handleValueChange}
				inputValue={inputValue}
				onInputValueChange={setInputValue}
			>
				<ComboboxInput
					placeholder={placeholder}
					className="w-full"
					showClear
					onBlur={handleInputBlur}
				/>
				<ComboboxContent container={containerRef} className="w-full p-0">
					<ComboboxList>
						{options.map((option) => (
							<ComboboxItem
								key={option.value}
								value={option.value}
								className="cursor-pointer"
							>
								{option.color && (
									<div
										className="w-3 h-3 rounded-full mr-2 shrink-0 border border-border/50"
										style={{ backgroundColor: option.color }}
									/>
								)}
								<span className="truncate">{option.label}</span>
							</ComboboxItem>
						))}

						{isCreating && (
							<ComboboxItem
								value={inputValue.trim()}
								className="cursor-pointer text-primary"
							>
								<PlusIcon className="mr-2 h-4 w-4" />
								Create "{inputValue.trim()}"
							</ComboboxItem>
						)}

						{!isCreating && options.length === 0 && (
							<ComboboxEmpty>No results found.</ComboboxEmpty>
						)}

						{onManageClick && (
							<>
								<ComboboxSeparator />
								<ComboboxGroup>
									<ComboboxItem
										value={MANAGE_ACTION_VALUE}
										className="cursor-pointer font-medium text-muted-foreground hover:text-foreground"
									>
										<Settings2Icon className="mr-2 h-4 w-4" />
										Manage Categories
									</ComboboxItem>
								</ComboboxGroup>
							</>
						)}
					</ComboboxList>
				</ComboboxContent>
			</Combobox>
		</div>
	);
}
