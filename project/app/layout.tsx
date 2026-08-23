import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import type React from "react";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

// Exposed as a variable rather than applied directly: only the error screens and
// other machine-output surfaces use it, so it is opted into with `font-mono`
// where wanted instead of being inherited everywhere.
const geistMono = Geist_Mono({
	subsets: ["latin"],
	variable: "--font-geist-mono",
});

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: {
		template: "%s | Takda PH",
		default: "Takda PH",
	},
	description: "Team collaboration and project management platform",
	generator: "v0.dev",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		// afterSignOutUrl keeps sign-out inside the app. Without it Clerk falls
		// back to the instance's hosted page (accounts.dev/sign-in/choose), so
		// signing out dropped the user out of the product entirely.
		<ClerkProvider afterSignOutUrl="/">
			<html
				lang="en"
				suppressHydrationWarning
				className={cn("font-sans", geist.variable, geistMono.variable)}
			>
				<body className={inter.className} suppressHydrationWarning>
					<ThemeProvider>{children}</ThemeProvider>
				</body>
			</html>
		</ClerkProvider>
	);
}
