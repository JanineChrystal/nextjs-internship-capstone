import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/buttons/button";

export default function UnauthorizedPage() {
	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
			<ShieldAlert className="w-16 h-16 text-red-500" />
			<h2 className="text-3xl font-bold text-outer_space-500 dark:text-platinum-500">
				Account not ready yet
			</h2>
			{/* An expired session now redirects through sign-in instead of landing
			    here, so the only way to reach this page is signed in with no matching
			    account record - which the Clerk webhook creates moments after signup. */}
			<p className="text-payne's_gray-500 dark:text-french_gray-500 max-w-md">
				You are signed in, but your account is still being set up. This usually
				takes a moment after signing up - refresh the page to try again.
			</p>
			<div className="mt-4 flex items-center gap-2">
				<Button asChild>
					<Link href="/dashboard">Back to dashboard</Link>
				</Button>
				<Button asChild variant="outline">
					<Link href="/sign-in">Sign in again</Link>
				</Button>
			</div>
		</div>
	);
}
