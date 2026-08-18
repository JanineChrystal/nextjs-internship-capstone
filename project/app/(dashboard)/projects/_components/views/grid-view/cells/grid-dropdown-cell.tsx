import type { ReactNode } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface GridDropdownCellProps<T extends string> {
	className: string;
	options: readonly T[];
	onSelect: (value: T) => void;
	children: ReactNode;
}

export function GridDropdownCell<T extends string>({
	className,
	options,
	onSelect,
	children,
}: GridDropdownCellProps<T>) {
	return (
		<div className={className}>
			<DropdownMenu>
				<DropdownMenuTrigger className="focus:outline-none rounded-md hover:ring-2 ring-primary/30 transition-all">
					{children}
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start">
					{options.map((option) => (
						<DropdownMenuItem key={option} onClick={() => onSelect(option)}>
							{option}
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
