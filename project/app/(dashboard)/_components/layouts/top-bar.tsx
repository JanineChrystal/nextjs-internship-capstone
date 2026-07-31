import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function TopBar() {
	return (
		<header className="flex-none flex items-center justify-between w-full h-16 px-6 bg-card text-foreground rounded-xl shadow-md dark:bg-slate-900 border-none relative z-50">
			<div className="flex items-center gap-4">
				<span className="font-bold text-xl text-blue-600 dark:text-blue-400">
					TakdaPH
				</span>
				<SidebarTrigger />
			</div>

			<div className="flex items-center gap-4">
				<input
					type="text"
					placeholder="Search..."
					className="px-4 py-2 bg-background text-foreground dark:bg-slate-800 rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-500"
				/>
				<ThemeToggle />
				<UserButton />
			</div>
		</header>
	);
}
