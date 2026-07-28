"use client";

import { UserProfile } from "@clerk/nextjs";
import { Bell, Palette, User } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/buttons/button";

export default function SettingsPage() {
	const [activeTab, setActiveTab] = useState<
		"profile" | "notifications" | "security" | "appearance"
	>("profile");

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold text-outer_space-500 dark:text-platinum-500">
					Settings
				</h1>
				<p className="text-payne's_gray-500 dark:text-french_gray-500 mt-2">
					Manage your account and application preferences
				</p>
			</div>

			{/* Implementation Tasks Banner */}
			<div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
				<h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
					⚙️ Settings Implementation Tasks
				</h3>
				<ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
					<li>• Task 2.4: Implement user session management</li>
					<li>
						• Task 6.4: Implement project member management and permissions
					</li>
				</ul>
			</div>

			{/* Settings Sections */}
			<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
				{/* Settings Sidebar Navigation */}
				<div className="bg-white dark:bg-outer_space-500 rounded-lg border border-french_gray-300 dark:border-payne's_gray-400 p-4 h-fit">
					<h3 className="text-lg font-semibold text-outer_space-500 dark:text-platinum-500 mb-4 px-2">
						Settings
					</h3>
					<nav className="space-y-1">
						{[
							{ id: "profile", name: "Account", icon: User },
							{ id: "notifications", name: "Notifications", icon: Bell },
							{ id: "appearance", name: "Appearance", icon: Palette },
						].map((item) => (
							<Button
								key={item.id}
								onClick={() => setActiveTab(item.id as typeof activeTab)}
								className={`w-full flex items-center justify-start px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
									activeTab === item.id
										? "bg-blue_munsell-100 dark:bg-blue_munsell-900 text-blue_munsell-700 dark:text-blue_munsell-300"
										: "text-outer_space-500 dark:text-platinum-500 hover:bg-platinum-500 dark:hover:bg-payne's_gray-400"
								}`}
							>
								<item.icon className="mr-3" size={16} />
								{item.name}
							</Button>
						))}
					</nav>
				</div>

				{/* Settings Content Area */}
				<div className="lg:col-span-3">
					{activeTab === "profile" && (
						/* Clerk's component handles Profile info AND Password Changes out of the box */
						<div className="flex justify-center border border-french_gray-300 dark:border-payne's_gray-400 rounded-lg overflow-hidden bg-white dark:bg-outer_space-500">
							<UserProfile
								appearance={{
									elements: {
										rootBox: "w-full",
										cardBox: "w-full border-none shadow-none bg-transparent",
									},
								}}
							/>
						</div>
					)}

					{activeTab === "notifications" && (
						<div className="bg-white dark:bg-outer_space-500 rounded-lg border border-french_gray-300 dark:border-payne's_gray-400 p-6 text-outer_space-500 dark:text-platinum-500">
							<h3 className="text-lg font-semibold mb-2">
								Notifications Settings
							</h3>
							<p className="text-sm text-gray-500">
								Notification preferences draft placeholder...
							</p>
						</div>
					)}

					{activeTab === "appearance" && (
						<div className="bg-white dark:bg-outer_space-500 rounded-lg border border-french_gray-300 dark:border-payne's_gray-400 p-6 text-outer_space-500 dark:text-platinum-500">
							<h3 className="text-lg font-semibold mb-2">
								Appearance Settings
							</h3>
							<p className="text-sm text-gray-500">
								Theme and UI settings draft placeholder...
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
