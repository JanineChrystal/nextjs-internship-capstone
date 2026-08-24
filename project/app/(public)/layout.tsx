import { Toaster } from "@/components/ui/toaster";
import { FloatingDock } from "./_components/layouts/floating-dock";
import { Footer } from "./_components/layouts/footer";
import { Navbar } from "./_components/layouts/navbar";

/**
 * public layout - mounts the FloatingDock and Toaster at the root to
 * ensure they survive navigation between public routes without remounting
 * or dropping toast notifications.
 */
export default function PublicLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex min-h-screen flex-col bg-background">
			<Navbar />
			<main className="flex-1">{children}</main>
			<Footer />
			<FloatingDock />
			<Toaster />
		</div>
	);
}
