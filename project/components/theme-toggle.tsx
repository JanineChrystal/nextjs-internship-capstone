"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/buttons/button";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
	const [mounted, setMounted] = useState(false);
	const { theme, setTheme } = useTheme();

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return (
			<Button
				type="button"
				className="p-2 rounded-lg bg-background text-foreground opacity-0 pointer-events-none"
				aria-label="Toggle theme"
			>
				<Sun size={20} />
			</Button>
		);
	}

	return (
		<Button
			type="button"
			onClick={() => setTheme(theme === "light" ? "dark" : "light")}
			className="p-2 rounded-lg bg-background text-foreground"
			aria-label="Toggle theme"
		>
			{theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
		</Button>
	);
}
