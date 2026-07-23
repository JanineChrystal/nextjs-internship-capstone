export default function PublicLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		// A clean container for all public-facing pages
		<div className="flex min-h-screen flex-col">
			{/* <header>Project Flow Public Header</header> */}

			<main className="flex-1">{children}</main>

			{/* <footer>Public Footer © 2026</footer> */}
		</div>
	);
}
