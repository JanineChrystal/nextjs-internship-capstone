"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

import type { ColumnDef } from "@/types/grid-table";

interface GridTableProps<T> {
	data: T[];
	columns: ColumnDef[];
	renderRow: (item: T, index: number) => ReactNode;
	renderFooter?: () => ReactNode;
	className?: string;
}

export function GridTable<T extends { id: string | number }>({
	data,
	columns,
	renderRow,
	renderFooter,
	className,
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
				{columns.map((col) => (
					<div
						key={col.key}
						className={cn(
							"font-medium text-secondary text-sm",
							col.className || "flex-1",
						)}
					>
						{col.renderHeader ? col.renderHeader() : col.title}
					</div>
				))}
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

			{/* Footer (e.g. Add Task row) */}
			{renderFooter && (
				<div className="flex w-full items-center px-4 py-3 hover:bg-surface-container-low transition-colors">
					{renderFooter()}
				</div>
			)}
		</div>
	);
}
