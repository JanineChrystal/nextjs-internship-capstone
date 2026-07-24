import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
	matcher: [
		// skip Next.js internals, static files, and the webhooks route
		"/((?!_next|api/webhooks|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		// always run for API routes, except for the webhooks path
		"/(api(?!/webhooks)|trpc)(.*)",
		// always run for Clerk-specific frontend API routes
		"/__clerk/(.*)",
	],
};
