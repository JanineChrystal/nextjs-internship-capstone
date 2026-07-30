import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/buttons/button";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function TopBar() {
	return (
		<header className="flex-none flex items-center justify-between w-full h-16 px-6 bg-white rounded-xl shadow-md dark:bg-slate-900 border-none relative z-50">
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
					className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-500"
				/>
				<Button className="p-2 text-sm rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
					🌙
				</Button>
				<UserButton />
			</div>
		</header>
	);
}
