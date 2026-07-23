import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SideBar } from "./_components/layouts/sidebar";

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
		<div>
			<SideBar>{children}</SideBar>
		</div>
	);
}
