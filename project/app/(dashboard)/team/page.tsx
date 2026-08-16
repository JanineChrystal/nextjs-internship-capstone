import type { Metadata } from "next";
import { requireUser } from "@/lib/dal/auth";
import { getWorkspaceDirectoryDAL } from "@/lib/dal/workspace-members";
import { TeamPageClient } from "./_components/team-page-client";

export const metadata: Metadata = {
	title: "Team",
};

export default async function TeamPage() {
	await requireUser();

	const members = await getWorkspaceDirectoryDAL();

	return <TeamPageClient initialMembers={members} />;
}
