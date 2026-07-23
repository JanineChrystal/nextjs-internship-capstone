import { clerkMiddleware } from "@clerk/nextjs/server";

const protectedRoutes = [
	"/analytics",
	"/calendar",
	"/dashboard",
	"/projects",
	"/settings",
	"/team",
];

export default clerkMiddleware(async (auth, req) => {
	const isProtected = protectedRoutes.some((route) =>
		req.nextUrl.pathname.startsWith(route),
	);

	if (isProtected) {
		await auth.protect();
	}
});

export const config = {
	matcher: [
		// Skip Next.js internals and all static files, unless found in search params
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		// Always run for API routes
		"/(api|trpc)(.*)",
		// Always run for Clerk-specific frontend API routes
		"/__clerk/(.*)",
	],
};
