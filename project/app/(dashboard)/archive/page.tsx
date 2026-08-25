import type { Metadata } from "next";
import { TRASH_RETENTION_DAYS } from "@/lib/constants/archive";
import { getArchivePageDAL } from "@/lib/dal/archive";
import { requireUser } from "@/lib/dal/auth";
import { PageHeader } from "../_components/ui/headers/page-header";
import { ArchiveClient } from "./archive-client";

export const metadata: Metadata = {
	title: "Archive",
};

export default async function ArchivePage() {
	await requireUser();

	// Reading this page is also what sweeps away anything past its retention
	// window - see the note on purgeExpired for why the sweep is here rather than
	// on a schedule.
	const initial = await getArchivePageDAL();

	return (
		<div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-8">
			<PageHeader
				title="Archive"
				description={`Projects and tasks you have set aside. Archived items are kept indefinitely; trashed items are deleted permanently after ${TRASH_RETENTION_DAYS} days.`}
			>
				{initial.purgedCount > 0 && (
					<p className="text-xs text-secondary">
						{initial.purgedCount} expired{" "}
						{initial.purgedCount === 1 ? "item was" : "items were"} permanently
						deleted on this visit.
					</p>
				)}
			</PageHeader>

			<ArchiveClient initial={initial} />
		</div>
	);
}
