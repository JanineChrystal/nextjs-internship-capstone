"use client";

import { FolderOpen, Inbox, SquareCheckBig } from "lucide-react";
import { useState } from "react";
import { ActionConfirmModal } from "@/components/modals/action-confirm-modal";
import { Button } from "@/components/ui/buttons/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { ArchiveOperation } from "@/lib/dal/archive";
import type { ArchivedItemDTO } from "@/lib/dtos/archive-dto";
import { formatDate } from "@/lib/utils/date";
import type { ArchiveActionConfig } from "../_constants/archive";

interface ArchiveListProps {
	items: ArchivedItemDTO[];
	actions: ArchiveActionConfig[];
	busyId: string | null;
	emptyTitle: string;
	emptyDescription: string;
	onApply: (
		item: ArchivedItemDTO,
		operation: ArchiveOperation,
		successMessage: string,
	) => void;
}

/**
 * archive list - renders items for both archive and trash tabs, using
 * injected action configs to ensure rows behave and look identical
 * across different operations.
 */
export function ArchiveList({
	items,
	actions,
	busyId,
	emptyTitle,
	emptyDescription,
	onApply,
}: ArchiveListProps) {
	const [pendingConfirm, setPendingConfirm] = useState<{
		item: ArchivedItemDTO;
		action: ArchiveActionConfig;
	} | null>(null);

	if (items.length === 0) {
		return (
			<EmptyState
				subdued
				icon={Inbox}
				title={emptyTitle}
				description={emptyDescription}
			/>
		);
	}

	return (
		<>
			<ul className="divide-y divide-border">
				{items.map((item) => {
					const Icon = item.kind === "project" ? FolderOpen : SquareCheckBig;
					const isBusy = busyId === item.id;

					return (
						<li
							key={`${item.kind}-${item.id}`}
							className="flex flex-wrap items-center gap-4 py-4"
						>
							<Icon
								className="h-4 w-4 text-secondary shrink-0"
								aria-hidden="true"
							/>

							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-on-surface truncate">
									{item.name}
								</p>
								<p className="text-xs text-secondary mt-0.5">
									{item.kind === "project"
										? "Project"
										: `Task${item.projectName ? ` in ${item.projectName}` : ""}`}
									{" · "}
									{formatDate(item.at.toISOString())}
									{item.daysLeft !== null && (
										<>
											{" · "}
											<span
												className={
													item.daysLeft <= 7 ? "text-error" : undefined
												}
											>
												{item.daysLeft === 0
													? "Deleting today"
													: `${item.daysLeft} day${item.daysLeft === 1 ? "" : "s"} left`}
											</span>
										</>
									)}
								</p>
							</div>

							<div className="flex items-center gap-2 shrink-0">
								{actions.map((action) => (
									<Button
										key={action.operation}
										type="button"
										variant={
											action.variant === "destructive" ? "ghost" : "outline"
										}
										size="sm"
										disabled={isBusy}
										className={
											action.variant === "destructive"
												? "text-error hover:text-error hover:bg-error/10"
												: undefined
										}
										onClick={() => {
											// A confirmation only stands in front of the operation
											// that cannot be undone; everything else is reachable
											// from the other tab.
											if (action.confirm) {
												setPendingConfirm({ item, action });
												return;
											}
											onApply(item, action.operation, action.successMessage);
										}}
									>
										{action.label}
									</Button>
								))}
							</div>
						</li>
					);
				})}
			</ul>

			<ActionConfirmModal
				isOpen={pendingConfirm !== null}
				onClose={() => setPendingConfirm(null)}
				onConfirm={() => {
					if (!pendingConfirm) return;
					onApply(
						pendingConfirm.item,
						pendingConfirm.action.operation,
						pendingConfirm.action.successMessage,
					);
					setPendingConfirm(null);
				}}
				title={pendingConfirm?.action.confirm?.title ?? ""}
				description={
					pendingConfirm
						? `${pendingConfirm.action.confirm?.description ?? ""} ("${pendingConfirm.item.name}")`
						: ""
				}
				confirmText={pendingConfirm?.action.confirm?.confirmText}
				isDestructive
			/>
		</>
	);
}
