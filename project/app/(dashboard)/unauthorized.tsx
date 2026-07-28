import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/buttons/button";

export default function UnauthorizedPage() {
	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
			<ShieldAlert className="w-16 h-16 text-red-500" />
			<h2 className="text-3xl font-bold text-outer_space-500 dark:text-platinum-500">
				401 - Unauthorized
			</h2>
			<p className="text-payne's_gray-500 dark:text-french_gray-500 max-w-md">
				Please log in to access this page. You must have an active session to
				view this content.
			</p>
			<Button asChild className="mt-4">
				<Link href="/sign-in">Go to Login</Link>
			</Button>
		</div>
	);
}
