import { Toaster } from "@/components/ui/toaster";
import { FloatingDock } from "./_components/layouts/floating-dock";
import { Footer } from "./_components/layouts/footer";
import { Navbar } from "./_components/layouts/navbar";

/**
 * The shell every public page shares.
 *
 * The dock is here rather than on the page because it is chrome: it belongs to
 * the site, not to one document, and mounting it in the layout means it survives
 * a client navigation between public routes without its drawers remounting and
 * losing a half-typed message.
 *
 * `Toaster` is mounted here too because the contact form reports success and
 * failure through the app's shared toast helpers. The dashboard layout has its
 * own; the public group had none, so a submitted form would have shown nothing
 * at all - the toast would have been dispatched into a portal that was never
 * rendered.
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
