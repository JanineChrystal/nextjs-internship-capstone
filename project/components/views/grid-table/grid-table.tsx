"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ColumnDef } from "@/types/grid-table";

interface GridTableProps<T> {
	data: T[];
	columns: ColumnDef[];
	renderRow: (item: T, index: number) => ReactNode;
	renderFooter?: () => ReactNode;
	className?: string;
	sortConfig?: { key: string; direction: "asc" | "desc" } | null;
	onSort?: (key: string) => void;
}

export function GridTable<T extends { id: string | number }>({
	data,
	columns,
	renderRow,
	renderFooter,
	className,
	sortConfig,
	onSort,
}: GridTableProps<T>) {
	return (
		<div
			className={cn(
				"w-full rounded-lg border border-outline-variant bg-surface overflow-hidden",
				className,
			)}
		>
			{/* Header */}
			<div className="flex w-full items-center px-4 py-3 border-b border-outline-variant bg-surface-container-lowest">
				{columns.map((col) => {
					const HeaderContent = (
						<>
							{col.renderHeader ? col.renderHeader() : col.title}
							{col.sortable && (
								<div className="ml-1 flex items-center">
									{sortConfig?.key === col.key ? (
										sortConfig.direction === "asc" ? (
											<ArrowUp className="h-3.5 w-3.5 text-foreground" />
										) : (
											<ArrowDown className="h-3.5 w-3.5 text-foreground" />
										)
									) : (
										<ArrowUpDown className="h-3.5 w-3.5 opacity-0 group-hover/header:opacity-50 transition-opacity" />
									)}
								</div>
							)}
						</>
					);

					if (col.sortable) {
						return (
							<button
								key={col.key}
								type="button"
								className={cn(
									"font-medium text-secondary text-sm flex items-center group/header text-left cursor-pointer select-none bg-transparent hover:bg-surface-variant/50 px-2 py-1.5 -ml-2 rounded-md transition-colors",
									col.className || "flex-1",
								)}
								onClick={() => onSort?.(col.key)}
							>
								{HeaderContent}
							</button>
						);
					}

					return (
						<div
							key={col.key}
							className={cn(
								"font-medium text-secondary text-sm flex items-center text-left px-2 py-1.5 -ml-2",
								col.className || "flex-1",
							)}
						>
							{HeaderContent}
						</div>
					);
				})}
			</div>

			{/* Rows */}
			<div className="flex flex-col w-full">
				{data.map((item, index) => (
					<div
						key={item.id}
						className="flex w-full items-center px-4 py-3 border-b border-outline-variant/50 hover:bg-surface-container-lowest/50 transition-colors group"
					>
						{renderRow(item, index)}
					</div>
				))}
			</div>

			{/* Footer */}
			{renderFooter && (
				<div className="flex w-full items-center px-4 py-3 hover:bg-surface-container-low transition-colors">
					{renderFooter()}
				</div>
			)}
		</div>
	);
}
