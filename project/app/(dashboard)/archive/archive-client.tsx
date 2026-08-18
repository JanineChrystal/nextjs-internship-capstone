"use client";

import { useState } from "react";
import { BaseCard } from "@/components/ui/cards/base-card";
import { TRASH_RETENTION_DAYS } from "@/lib/constants/archive";
import type { ArchivePageDTO } from "@/lib/dtos/archive-dto";
import { ViewTabs } from "../_components/ui/toolbar/view-tabs";
import { ArchiveList } from "./_components/archive-list";
import {
	ARCHIVE_TAB_ACTIONS,
	ARCHIVE_TABS,
	type ArchiveTab,
} from "./_constants/archive";
import { useArchive } from "./_hooks/use-archive";

interface ArchiveClientProps {
	initial: ArchivePageDTO;
}

export function ArchiveClient({ initial }: ArchiveClientProps) {
	const [tab, setTab] = useState<ArchiveTab>("archive");
	const { archived, trashed, busyId, apply } = useArchive(initial);

	const isArchiveTab = tab === "archive";
	const items = isArchiveTab ? archived : trashed;

	return (
		<BaseCard className="hover:scale-100 gap-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<ViewTabs tabs={ARCHIVE_TABS} activeView={tab} onViewChange={setTab} />

				<p className="text-xs text-secondary">
					{isArchiveTab
						? "Archived items are hidden from your boards and lists, and kept indefinitely."
						: `Trashed items are permanently deleted ${TRASH_RETENTION_DAYS} days after they were removed.`}
				</p>
			</div>

			<ArchiveList
				items={items}
				actions={ARCHIVE_TAB_ACTIONS[tab]}
				busyId={busyId}
				emptyTitle={isArchiveTab ? "Nothing archived" : "Trash is empty"}
				emptyDescription={
					isArchiveTab
						? "Archive a project or task and it will wait here until you want it back."
						: "Deleted projects and tasks appear here before they are removed for good."
				}
				onApply={apply}
			/>
		</BaseCard>
	);
}
