import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import { clerkAuthAppearance } from "@/lib/clerk/appearance";
import { AuthShell } from "../../_components/auth-shell";

export const metadata: Metadata = {
	title: "Create an account",
	description: "Create a Takda PH account and start your first workspace.",
};

export default function SignUpPage() {
	return (
		<AuthShell
			switchPrompt="Already have an account?"
			switchLabel="Sign in"
			switchHref="/sign-in"
		>
			<SignUp
				forceRedirectUrl="/dashboard"
				fallbackRedirectUrl="/dashboard"
				appearance={clerkAuthAppearance}
			/>
		</AuthShell>
	);
}
