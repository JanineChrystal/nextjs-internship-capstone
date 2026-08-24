import { FolderLock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { EmptyState } from "@/components/ui/empty-state";
import type { ProfileProjectData, ProfileUser } from "@/lib/types/profile";
import { UserProjectCollapsible } from "./user-profile-collapsible";

interface UserProfileViewProps {
	user: ProfileUser;
	isSelf: boolean;
	projects: ProfileProjectData[];
}

/** initials - two letters at most, derived from the name rather than hard-coded. */
function initialsOf(name: string): string {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("");
}

export function UserProfileView({
	user,
	isSelf,
	projects,
}: UserProfileViewProps) {
	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:gap-8 sm:p-6">
			{/*
			 * breadcrumb in flow - it sits as the first child of the column with the
			 * container's own gap for spacing. The previous version pulled itself up
			 * with a negative margin, which is what put it on top of the header card
			 * as soon as the heading wrapped to a second line.
			 */}
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink href={isSelf ? "/dashboard" : "/team"}>
							{isSelf ? "Dashboard" : "Team"}
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage className="truncate">
							{isSelf ? "My profile" : user.name}
						</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			{/* profile header - stacks and centres on a phone, sits on one row from sm upward. */}
			<header className="flex flex-col items-center gap-4 rounded-xl border border-outline-variant bg-surface p-4 text-center shadow-sm sm:flex-row sm:items-center sm:gap-6 sm:p-6 sm:text-left">
				<Avatar className="size-16 shrink-0 border-2 border-primary sm:size-20">
					<AvatarImage src={user.avatarUrl} alt="" />
					<AvatarFallback className="bg-primary-container text-lg font-bold text-on-primary-container sm:text-xl">
						{initialsOf(user.name)}
					</AvatarFallback>
				</Avatar>

				<div className="flex min-w-0 flex-col gap-1">
					{/* wrap-break-word - names and addresses are user-supplied, and one long unbroken string would otherwise set the card's minimum width. */}
					<h1 className="wrap-break-word text-xl font-bold text-foreground sm:text-2xl">
						{user.name}
					</h1>
					<p className="wrap-break-word text-sm text-secondary">{user.email}</p>
				</div>
			</header>

			<section className="flex flex-col gap-4">
				<div className="flex flex-col gap-1">
					<h2 className="text-lg font-bold text-foreground sm:text-xl">
						{isSelf
							? "My assigned projects & tasks"
							: `Shared projects with ${user.name}`}
					</h2>
					<p className="text-xs text-secondary sm:text-sm">
						{isSelf
							? "Every project you can reach, with the tasks assigned to you inside each."
							: "Only the projects you both belong to are shown here."}
					</p>
				</div>

				{projects.length > 0 ? (
					<div className="flex flex-col gap-3">
						{projects.map((project) => (
							<UserProjectCollapsible key={project.id} project={project} />
						))}
					</div>
				) : (
					<EmptyState
						subdued
						icon={FolderLock}
						title={isSelf ? "No projects yet" : "No shared projects"}
						description={
							isSelf
								? "Projects you own or are invited to will appear here."
								: "You and this member do not currently share any projects."
						}
					/>
				)}
			</section>
		</div>
	);
}
