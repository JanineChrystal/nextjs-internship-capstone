"use client";

import { Combobox as ComboboxPrimitive } from "@base-ui/react";
import { Check, Search, UserPlus } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxGroup,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";
import { cn } from "@/lib/utils";
import type { Assignee } from "@/types/task";
import { PROJECT_MEMBERS } from "../../_constants/task-modal-constants";

interface AssigneeSelectorProps {
	assignees: Assignee[];
	onAssigneesChange: (assignees: Assignee[]) => void;
	triggerClassName?: string;
}

export function AssigneeSelector({
	assignees,
	onAssigneesChange,
	triggerClassName,
}: AssigneeSelectorProps) {
	const [open, setOpen] = React.useState(false);
	const [searchQuery, setSearchQuery] = React.useState("");

	const handleSelect = (member: Assignee) => {
		const isAssigned = assignees.some((a) => a.name === member.name);
		if (isAssigned) {
			onAssigneesChange(assignees.filter((a) => a.name !== member.name));
		} else {
			onAssigneesChange([...assignees, member]);
		}
	};

	const filteredMembers = PROJECT_MEMBERS.filter(
		(member) =>
			member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			member.email?.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	return (
		<Combobox open={open} onOpenChange={setOpen}>
			<ComboboxPrimitive.Trigger
				className={cn(
					"h-8 w-8 rounded-full border border-dashed border-outline-variant hover:bg-surface-variant transition-colors text-secondary focus:outline-none flex items-center justify-center shrink-0",
					triggerClassName,
				)}
			>
				<UserPlus className="h-4 w-4" />
			</ComboboxPrimitive.Trigger>

			<ComboboxContent
				align="start"
				className="w-80 p-0 overflow-hidden z-50 rounded-md border bg-popover shadow-md"
			>
				<div className="flex items-center border-b px-2 py-1">
					<Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
					<ComboboxPrimitive.Input
						placeholder="Type a name or email address"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-hidden placeholder:text-muted-foreground"
					/>
				</div>

				<ComboboxList className="max-h-75 overflow-y-auto p-1">
					{filteredMembers.length === 0 ? (
						<ComboboxEmpty className="py-6 text-center text-sm">
							No members found.
						</ComboboxEmpty>
					) : (
						<ComboboxGroup className="p-1">
							<div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
								Suggestions
							</div>
							{filteredMembers.map((member) => {
								const isSelected = assignees.some(
									(a) => a.name === member.name,
								);
								return (
									<ComboboxItem
										key={member.name}
										value={member.name}
										onSelect={() => handleSelect(member)}
										className="relative flex cursor-pointer select-none items-center gap-3 rounded-sm px-2 py-2 text-sm outline-hidden hover:bg-accent hover:text-accent-foreground data-highlighted:bg-accent data-highlighted:text-accent-foreground"
									>
										<Image
											src={member.avatarUrl}
											alt={member.name}
											width={32}
											height={32}
											className="rounded-full bg-surface-variant shrink-0"
										/>
										<div className="flex flex-col flex-1 overflow-hidden">
											<span className="text-sm font-medium truncate">
												{member.name}
											</span>
											<span className="text-xs text-secondary truncate">
												{member.email}
											</span>
										</div>
										{isSelected && (
											<Check className="ml-auto h-4 w-4 text-primary shrink-0" />
										)}
									</ComboboxItem>
								);
							})}
						</ComboboxGroup>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
}
