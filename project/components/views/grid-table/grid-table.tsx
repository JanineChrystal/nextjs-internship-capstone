"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ColumnDef } from "@/types/grid-table";

interface GridTableProps<T> {
	data: T[];
	columns: ColumnDef[];
	renderRow: (item: T, index: number) => ReactNode;
	keyExtractor?: (item: T) => string | number;
	renderEmptyState?: () => ReactNode;
	renderFooter?: () => ReactNode;
	className?: string;
	sortConfig?: { key: string; direction: "asc" | "desc" } | null;
	onSort?: (key: string) => void;
}

export function GridTable<T>({
	data,
	columns,
	renderRow,
	keyExtractor,
	renderEmptyState,
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
									"font-medium text-secondary text-sm flex items-center group/header cursor-pointer select-none bg-transparent hover:bg-surface-variant/50 py-1.5 rounded-md transition-colors",
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
								"font-medium text-secondary text-sm flex items-center py-1.5",
								col.className || "flex-1",
							)}
						>
							{HeaderContent}
						</div>
					);
				})}
			</div>

			{/* Rows */}
			{data.length === 0 && renderEmptyState ? (
				<div className="flex flex-col w-full">{renderEmptyState()}</div>
			) : (
				<div className="flex flex-col w-full">
					{data.map((item, index) => {
						const itemKey = keyExtractor
							? keyExtractor(item)
							: typeof item === "object" &&
									item !== null &&
									"id" in item &&
									(typeof item.id === "string" || typeof item.id === "number")
								? item.id
								: index;
						return (
							<div
								key={itemKey}
								className="flex w-full items-center px-4 py-3 border-b border-outline-variant/50 hover:bg-surface-container-lowest/50 transition-colors group"
							>
								{renderRow(item, index)}
							</div>
						);
					})}
				</div>
			)}

			{/* Footer */}
			{renderFooter && (
				<div className="flex w-full items-center px-4 py-3 hover:bg-surface-container-low transition-colors">
					{renderFooter()}
				</div>
			)}
		</div>
	);
}
