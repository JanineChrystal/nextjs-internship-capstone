import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import { clerkAuthAppearance } from "@/lib/clerk/appearance";
import { AuthShell } from "../../_components/auth-shell";

export const metadata: Metadata = {
	title: "Sign in",
	description: "Sign in to your Takda PH workspace.",
};

export default function SignInPage() {
	return (
		<AuthShell
			switchPrompt="New here?"
			switchLabel="Create an account"
			switchHref="/sign-up"
		>
			<SignIn
				forceRedirectUrl="/dashboard"
				fallbackRedirectUrl="/dashboard"
				appearance={clerkAuthAppearance}
			/>
		</AuthShell>
	);
}
