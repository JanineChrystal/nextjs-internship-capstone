import { Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/buttons/button";

export default function ForbiddenPage() {
	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
			<Lock className="w-16 h-16 text-yellow-500" />
			<h2 className="text-3xl font-bold text-outer_space-500 dark:text-platinum-500">
				403 - Forbidden
			</h2>
			<p className="text-payne's_gray-500 dark:text-french_gray-500 max-w-md">
				You are not authorized to access this resource. If you believe this is a
				mistake, contact your project manager.
			</p>
			<Button asChild className="mt-4">
				<Link href="/dashboard">Return to Dashboard</Link>
			</Button>
		</div>
	);
}
