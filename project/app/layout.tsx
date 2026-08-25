import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import type React from "react";
import "./globals.css";
import { PaletteEffect } from "@/components/palette-effect";
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
	// No `icons` block on purpose. `app/icon.tsx` draws the tab icon and Next
	// emits the link tag for it automatically - declaring `icons` here would
	// override that file convention and the generated icon would never be used.
	//
	// Was also `generator: "v0.dev"`, left over from the scaffold - a meta tag
	// telling every visitor the site was generated, on a project that has since
	// been written by hand.
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
					<ThemeProvider>
						{/* Inside the provider because the palette derives different
						    values for light and dark, so it has to read the current mode.
						    Renders nothing - it only writes custom properties to <html>. */}
						<PaletteEffect />
						{children}
					</ThemeProvider>
				</body>
			</html>
		</ClerkProvider>
	);
}
