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
        // define allowed sources for scripts, styles, images, and network calls
        key: "Content-Security-Policy",
        value: "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https://img.clerk.com https://images.clerk.dev data:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com; connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com; worker-src 'self' blob:;",
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
    // asynchronous function to inject custom headers into server responses
    async headers() {
        return [
            {
                // apply these security headers to all routes globally
                source: "/(.*)",
                headers: securityHeaders,
            },
        ];
    },
};

export default nextConfig;