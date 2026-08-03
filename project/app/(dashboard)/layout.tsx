// import { auth } from "@clerk/nextjs/server";
// import { redirect } from "next/navigation";
// import { SideBar } from "./_components/layouts/sidebar";

// export default async function DashboardLayout({
// 	children,
// }: {
// 	children: React.ReactNode;
// }) {
// 	const { userId } = await auth();

// 	if (!userId) {
// 		redirect("/sign-in");
// 	}

// 	return (
// 		<div>
// 			<SideBar>{children}</SideBar>
// 		</div>
// 	);
// }

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
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

	return (
		<TooltipProvider>
			<SidebarProvider>
				<AppSidebar />
				<SidebarInset className="flex flex-col min-h-screen bg-background overflow-hidden">
					<TopBar />
					<main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
				</SidebarInset>
			</SidebarProvider>
		</TooltipProvider>
	);
}
