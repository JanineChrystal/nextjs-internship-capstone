import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getCurrentUser } from "@/lib/dal/auth";
import { claimPendingInvitesForUserDAL } from "@/lib/dal/pending-invites";
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

	// Fallback for the Clerk webhook, which needs a publicly reachable URL and so
	// cannot be relied on in local development. Runs after the response is sent so
	// it never delays a page, and is safe to repeat because claiming is
	// idempotent - a claimed invite is stamped and skipped next time.
	after(async () => {
		try {
			const user = await getCurrentUser();
			if (user?.email) {
				await claimPendingInvitesForUserDAL(user.email, user.id);
			}
		} catch (error) {
			console.error("Pending invite claim (layout fallback) failed:", error);
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
