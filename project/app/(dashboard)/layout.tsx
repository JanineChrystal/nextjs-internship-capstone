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

	// Fallback for the Clerk webhook, which is delivered over the public internet
	// and can fail to arrive - a local tunnel that is down, or a deployment behind
	// an auth wall that rejects it before it reaches us. Runs after the response
	// is sent so it never delays a page, and every step is safe to repeat.
	after(async () => {
		try {
			// Create the row first when it is missing, THEN claim. Claiming alone
			// could never fix a missing user, because it needs an id to grant access
			// to - which is how a new signup could end up stuck with no way forward.
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
			{/* Collapsed to the icon rail on every screen size, every load.
			    An earlier version expanded it on wide viewports from the client,
			    which meant the sidebar visibly widened a moment after the page
			    appeared - and it overrode a preference the reader had not been
			    asked about. Starting narrow is quiet: nothing moves, the content
			    gets the width, and one click opens it for anyone who wants it. */}
			<SidebarProvider defaultOpen={false}>
				<AppSidebar />
				<SidebarInset className="flex min-h-screen flex-col overflow-hidden bg-background">
					<TopBar />
					{/* Capped and centred rather than full-bleed. Dashboard content is
					    mostly text and tables, and a line of task titles stretched
					    across a 27-inch monitor is unreadable for the same reason a
					    newspaper uses columns. */}
					<main className="flex-1 overflow-y-auto">
						<div className="mx-auto w-full max-w-container-max p-4 md:p-6 lg:p-8">
							{children}
						</div>
					</main>
				</SidebarInset>
				{/* Mounted once here so every dashboard route can report a failed
				    server action instead of silently rolling its UI back. */}
				<Toaster />
			</SidebarProvider>
		</TooltipProvider>
	);
}
