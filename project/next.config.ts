import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typescript: {
		ignoreBuildErrors: true,
	},
	images: {
		unoptimized: true,
	},
	experimental: {
		authInterrupts: true,
	},
	// Next treats a dev request whose Origin is not localhost as cross-origin and
	// restricts it, which breaks HMR and the error overlay when the dev server is
	// reached through an ngrok tunnel - the symptom being dev-only requests such
	// as __nextjs_original-stack-frames taking tens of seconds.
	//
	// Only needed because the tunnel is used for Clerk webhooks during
	// development; production is served from its own origin and unaffected.
	allowedDevOrigins: [
		"*.ngrok-free.dev",
		"*.ngrok-free.app",
		"*.ngrok.io",
		"*.ngrok.app",
	],
};

export default nextConfig;
