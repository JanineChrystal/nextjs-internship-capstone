import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getCurrentUser } from "@/lib/dal/auth";
import { claimPendingInvitesForUserDAL } from "@/lib/dal/pending-invites";
import { syncClerkUserToDbDAL } from "@/lib/dal/users";
import { AppSidebar } from "./_components/layouts/app-sidebar";
import { TopBar } from "./_components/layouts/top-bar";

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { userId } = await auth();

	if (!userId) {
		redirect("/sign-in");
	}

	// webhook fallback sync - safely syncs users and claims invites in a non-blocking `after` hook in case the Clerk webhook fails.
	after(async () => {
		try {
			// ordered sync - ensures the user row is created before attempting to claim invites, avoiding deadlocks for new signups.
			const user = (await getCurrentUser()) ?? (await syncClerkUserToDbDAL());
			if (user?.email) {
				await claimPendingInvitesForUserDAL(user.email, user.id);
			}
		} catch (error) {
			console.error(
				"Clerk sync / invite claim (layout fallback) failed:",
				error,
			);
		}
	});

	return (
		<TooltipProvider>
			{/*
			  default collapsed sidebar - starts closed across all viewports to
			  prevent layout shift on load and respects user preference by letting
			  them choose when to expand it.
			*/}
			<SidebarProvider defaultOpen={false}>
				<AppSidebar />
				<SidebarInset className="flex min-h-screen flex-col overflow-hidden bg-background">
					<TopBar />
					{/*
					  centred constrained layout - caps maximum width to maintain
					  readable line lengths for text and tables on ultra-wide screens.
					*/}
					<main className="flex-1 overflow-y-auto">
						<div className="mx-auto w-full max-w-container-max p-4 md:p-6 lg:p-8">
							{children}
						</div>
					</main>
				</SidebarInset>
				{/*
				  global toaster - mounted here to ensure all dashboard routes can
				  report server action failures without silently rolling back.
				*/}
				<Toaster />
			</SidebarProvider>
		</TooltipProvider>
	);
}
