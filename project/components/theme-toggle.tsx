"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/buttons/button";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();

	return (
		<Button
			onClick={() => setTheme(theme === "light" ? "dark" : "light")}
			className="p-2 rounded-lg bg-background text-foreground"
			aria-label="Toggle theme"
		>
			{theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
		</Button>
	);
}
