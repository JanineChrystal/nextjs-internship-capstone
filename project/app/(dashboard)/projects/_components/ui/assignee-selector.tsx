"use client";

import { Check, Search, UserPlus } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Assignee } from "@/types/task";
import { useAssigneeSelector } from "../../_hooks/use-assignee-selector";

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
	const {
		open,
		setOpen,
		searchQuery,
		setSearchQuery,
		handleSelect,
		filteredMembers,
	} = useAssigneeSelector(assignees, onAssigneesChange);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className={cn(
						"h-8 w-8 rounded-full border border-dashed border-outline-variant hover:bg-surface-variant transition-colors text-secondary focus:outline-none flex items-center justify-center shrink-0",
						triggerClassName,
					)}
				>
					<UserPlus className="h-4 w-4" />
				</Button>
			</PopoverTrigger>

			<PopoverContent
				align="start"
				className="w-80 p-0 overflow-hidden z-50 rounded-md border bg-popover shadow-md"
			>
				<div className="flex items-center border-b px-2 py-1">
					<Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
					<Input
						placeholder="Type a name or email address"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="flex h-10 w-full rounded-md bg-transparent border-0 shadow-none py-2 text-sm outline-hidden placeholder:text-muted-foreground focus-visible:ring-0"
					/>
				</div>

				<div className="max-h-75 overflow-y-auto p-1">
					{filteredMembers.length === 0 ? (
						<div className="py-6 text-center text-sm text-muted-foreground">
							No members found.
						</div>
					) : (
						<div className="p-1 space-y-0.5">
							<div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
								Suggestions
							</div>
							{filteredMembers.map((member) => {
								const isSelected = assignees.some(
									(a) => a.userId === member.userId,
								);
								return (
									<button
										key={member.userId}
										type="button"
										onClick={() => handleSelect(member)}
										className="relative flex w-full text-left cursor-pointer select-none items-center gap-3 rounded-sm px-2 py-2 text-sm outline-hidden hover:bg-accent hover:text-accent-foreground"
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
									</button>
								);
							})}
						</div>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
