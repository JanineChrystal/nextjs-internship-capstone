"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const FALLBACK_TINT = "#2b5bb5";
const HEX = /^#[0-9a-f]{6}$/i;

/**
 * glowing wave - renders an animated, luminous sine wave background using
 * Canvas to avoid DOM thrashing from constant path updates. Colors are synced
 * dynamically from CSS variables via observers to support themes seamlessly.
 */
export function GlowingWave({ className }: { className?: string }) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		let width = 0;
		let height = 0;
		let tint = FALLBACK_TINT;
		let isDark = false;
		let raf = 0;

		const readTheme = () => {
			const value = getComputedStyle(document.documentElement)
				.getPropertyValue("--surface-tint")
				.trim();
			/**
			 * enforce 6-digit hex - verifies the theme token format to safely
			 * append alpha suffixes, falling back if it's not exactly 6-digit hex.
			 */
			tint = HEX.test(value) ? value : FALLBACK_TINT;
			isDark = document.documentElement.classList.contains("dark");
		};

		const resize = () => {
			/** cap pixel ratio - limits rendering density to save frame time on high-DPI screens without visual loss. */
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			const rect = canvas.getBoundingClientRect();
			width = rect.width;
			height = rect.height;
			canvas.width = Math.max(1, Math.floor(width * dpr));
			canvas.height = Math.max(1, Math.floor(height * dpr));
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		};

		const draw = (elapsed: number) => {
			ctx.clearRect(0, 0, width, height);
			if (width === 0 || height === 0) return;

			const baseY = height * 0.62;
			const amplitude = Math.min(height * 0.17, 150);

			/** off-canvas sweep - computes a sweep center that wraps smoothly from off-canvas to prevent sudden popping. */
			const sweepX = (((elapsed * 0.022) % 140) / 100 - 0.2) * width;
			const sigma = width * 0.26;

			const points: [number, number][] = [];
			for (let x = 0; x <= width; x += 2) {
				const distance = x - sweepX;
				const envelope = Math.exp(-(distance * distance) / (2 * sigma * sigma));
				const y =
					baseY +
					Math.sin(x * 0.0055 + elapsed * 0.0011) * amplitude * envelope;
				points.push([x, y]);
			}

			/** edge fading - applies a gradient stroke to dissolve the line's endpoints smoothly. */
			const stroke = ctx.createLinearGradient(0, 0, width, 0);
			stroke.addColorStop(0, `${tint}00`);
			stroke.addColorStop(0.5, `${tint}${isDark ? "ff" : "cc"}`);
			stroke.addColorStop(1, `${tint}00`);

			/**
			 * underlying wash - fills the wave body with a subtle gradient, dynamically
			 * adjusting alpha for light mode to maintain luminosity without smudging.
			 */
			const fill = ctx.createLinearGradient(0, baseY - amplitude, 0, height);
			fill.addColorStop(0, `${tint}${isDark ? "33" : "2b"}`);
			fill.addColorStop(1, `${tint}00`);

			ctx.beginPath();
			ctx.moveTo(0, points[0][1]);
			for (const [x, y] of points) ctx.lineTo(x, y);
			ctx.lineTo(width, height);
			ctx.lineTo(0, height);
			ctx.closePath();
			ctx.fillStyle = fill;
			ctx.fill();

			ctx.beginPath();
			ctx.moveTo(points[0][0], points[0][1]);
			for (const [x, y] of points) ctx.lineTo(x, y);
			ctx.strokeStyle = stroke;
			/** theme-adaptive stroke width - thickens the wave line in light mode to preserve contrast against bright backgrounds. */
			ctx.lineWidth = isDark ? 2 : 2.5;
			ctx.shadowBlur = isDark ? 48 : 34;
			ctx.shadowColor = `${tint}${isDark ? "aa" : "80"}`;
			ctx.stroke();
			ctx.shadowBlur = 0;
		};

		/** respect reduced motion - halts the animation loop while retaining a static composition frame for reduced-motion settings. */
		const prefersReducedMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		);

		const start = performance.now();
		const loop = (now: number) => {
			draw(now - start);
			raf = requestAnimationFrame(loop);
		};

		const render = () => {
			readTheme();
			resize();
			cancelAnimationFrame(raf);
			if (prefersReducedMotion.matches) {
				/** static climax frame - manually advances the clock to 3000ms so the static fallback displays a full wave. */
				draw(3000);
			} else {
				raf = requestAnimationFrame(loop);
			}
		};

		render();

		const themeObserver = new MutationObserver(readTheme);
		themeObserver.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class"],
		});

		const resizeObserver = new ResizeObserver(() => {
			readTheme();
			resize();
		});
		resizeObserver.observe(canvas);

		prefersReducedMotion.addEventListener("change", render);

		return () => {
			cancelAnimationFrame(raf);
			themeObserver.disconnect();
			resizeObserver.disconnect();
			prefersReducedMotion.removeEventListener("change", render);
		};
	}, []);

	/**
	 * accessible hiding wrapper - wraps the canvas in an aria-hidden div
	 * to cleanly obscure the purely decorative element from screen readers,
	 * sidestepping linter warnings on the canvas itself.
	 */
	return (
		<div
			aria-hidden="true"
			className={cn("pointer-events-none h-full w-full", className)}
		>
			<canvas ref={canvasRef} className="h-full w-full" />
		</div>
	);
}
