"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const FALLBACK_TINT = "#2b5bb5";
const HEX = /^#[0-9a-f]{6}$/i;

/**
 * A single luminous swell travelling slowly across the page.
 *
 * ## Why canvas rather than SVG or CSS
 *
 * The shape is a sine wave whose amplitude is shaped by a moving envelope, so
 * every frame is a different path. In SVG that means rewriting a `d` attribute
 * of a few hundred coordinates sixty times a second, which thrashes the DOM for
 * something that is purely decorative. CSS cannot express it at all - a
 * gradient can be animated, but not a curve whose geometry changes. Canvas
 * draws it in one pass with no DOM involved.
 *
 * ## Why it reads its colour from a CSS variable
 *
 * `--surface-tint` rather than a hard-coded blue, so the wave follows the theme
 * without a second definition - and follows the Phase 7 palettes for free, since
 * nothing here is a literal colour. The token is re-read when the theme class on
 * `<html>` changes, because a canvas holds pixels, not bindings: without the
 * observer it would keep painting last theme's colour until something else
 * forced a resize.
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
			// The alpha suffixes below build 8-digit hex, which only works if the
			// token really is 6-digit hex. Anything else falls back rather than
			// producing a colour string the canvas silently ignores.
			tint = HEX.test(value) ? value : FALLBACK_TINT;
			isDark = document.documentElement.classList.contains("dark");
		};

		const resize = () => {
			// Capped at 2: beyond that the extra pixels are invisible on a blurred
			// glow and cost real frame time on high-density displays.
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

			// The swell's centre, travelling left to right and wrapping. It starts
			// and ends off-canvas so the wave enters and leaves rather than popping
			// into existence at the edge.
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

			// Fades in and out at the edges so the line has no visible start or end.
			const stroke = ctx.createLinearGradient(0, 0, width, 0);
			stroke.addColorStop(0, `${tint}00`);
			stroke.addColorStop(0.5, `${tint}${isDark ? "ff" : "cc"}`);
			stroke.addColorStop(1, `${tint}00`);

			// The wash under the curve. Still lighter in light mode - the same alpha
			// over a near-white ground reads as a smudge rather than as light - but
			// not so light that it vanishes, which is what the first pass did.
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
			// A hair thicker on a light ground, where a 2px line at this alpha is
			// close to invisible against #f9f9f9.
			ctx.lineWidth = isDark ? 2 : 2.5;
			ctx.shadowBlur = isDark ? 48 : 34;
			ctx.shadowColor = `${tint}${isDark ? "aa" : "80"}`;
			ctx.stroke();
			ctx.shadowBlur = 0;
		};

		// A slow ambient animation is exactly what someone disables motion to be
		// rid of. One frame is still drawn, so the page keeps its composition
		// rather than losing the wave entirely.
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
				// Mid-sweep, so the still frame shows the wave at its fullest rather
				// than at whatever the clock happened to land on.
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

	// The canvas carries no ARIA of its own. It counts as an interactive element
	// to the linter - a canvas can be given focus and keyboard handling - so both
	// `aria-hidden` and a presentation role are rejected on it. The decoration is
	// hidden from assistive technology by the wrapper below, which is a plain div
	// and unambiguous. The canvas is empty of accessible content either way.
	return (
		<div
			aria-hidden="true"
			className={cn("pointer-events-none h-full w-full", className)}
		>
			<canvas ref={canvasRef} className="h-full w-full" />
		</div>
	);
}
