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
import { SidebarProvider } from "@/components/ui/sidebar";
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
			<SidebarProvider
				defaultOpen={false}
				className="flex flex-col bg-slate-100 dark:bg-slate-950 min-h-screen p-4 gap-4"
			>
				<TopBar />
				<div className="flex flex-1 overflow-hidden relative gap-4">
					<AppSidebar className="absolute! top-0! left-0! h-full!" />
					<main className="flex-1 overflow-y-auto rounded-xl bg-white dark:bg-slate-900 p-6 shadow-md">
						{children}
					</main>
				</div>
			</SidebarProvider>
		</TooltipProvider>
	);
}
