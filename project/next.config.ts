import type { NextConfig } from "next";

const securityHeaders = [
	{
		key: "X-Frame-Options",
		value: "DENY",
	},
	{
		key: "X-Content-Type-Options",
		value: "nosniff",
	},
	{
		key: "Strict-Transport-Security",
		value: "max-age=31536000; includeSubDomains",
	},
	{
		/**
		 * content security policy - allowed sources per resource type.
		 *
		 * Clerk's bot protection is Cloudflare Turnstile, which loads a script
		 * from challenges.cloudflare.com and renders it inside an iframe. Both
		 * have to be allowed: without the script-src entry the widget never
		 * loads, and without frame-src it falls back to default-src 'self' and
		 * the iframe is blocked. The symptom is "The CAPTCHA failed to load"
		 * on /sign-up, which reads like a browser extension problem and is not.
		 */
		key: "Content-Security-Policy",
		value: [
			"default-src 'self'",
			"style-src 'self' 'unsafe-inline'",
			"img-src 'self' https://img.clerk.com https://images.clerk.dev data:",
			"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com",
			"connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://clerk-telemetry.com",
			"frame-src 'self' https://challenges.cloudflare.com https://*.clerk.accounts.dev https://*.clerk.com",
			"worker-src 'self' blob:",
		].join("; "),
	},
];

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
	allowedDevOrigins: [
		"*.ngrok-free.dev",
		"*.ngrok-free.app",
		"*.ngrok.io",
		"*.ngrok.app",
	],
	// asynchronous function to inject custom headers into server responses
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: securityHeaders,
			},
		];
	},
};

export default nextConfig;
