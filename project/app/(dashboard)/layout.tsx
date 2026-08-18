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
			<SidebarProvider defaultOpen={false}>
				<AppSidebar />
				<SidebarInset className="flex flex-col min-h-screen bg-background overflow-hidden">
					<TopBar />
					<main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
				</SidebarInset>
				{/* Mounted once here so every dashboard route can report a failed
				    server action instead of silently rolling its UI back. */}
				<Toaster />
			</SidebarProvider>
		</TooltipProvider>
	);
}
