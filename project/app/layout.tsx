import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
import type React from "react";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: {
		template: "%s | Takda PH", // If a page exports "Dashboard", it becomes "Dashboard | Takda PH"
		default: "Takda PH", // Fallback if a specific page doesn't export a title
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
		<ClerkProvider>
			<html
				lang="en"
				suppressHydrationWarning
				className={cn("font-sans", geist.variable)}
			>
				<body className={inter.className}>
					<ThemeProvider>{children}</ThemeProvider>
				</body>
			</html>
		</ClerkProvider>
	);
}
