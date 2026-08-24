"use client";

import { useEffect, useState } from "react";

/**
 * coarse pointer detection - whether the primary input is a finger rather than
 * a mouse.
 *
 * This is deliberately not a width check. The behaviour it guards is about the
 * *input device*, not the screen: a tablet at 900px wide has the same touch
 * limitations as a phone, while a desktop window dragged narrow does not. Using
 * `useIsMobile` here left tablets broken, because they sit above its 768px line.
 *
 * Starts `false` so the server render and the first client render agree; the
 * effect corrects it before paint.
 */
export function useHasCoarsePointer(): boolean {
	const [isCoarse, setIsCoarse] = useState(false);

	useEffect(() => {
		const query = window.matchMedia("(pointer: coarse)");
		const update = () => setIsCoarse(query.matches);

		update();
		query.addEventListener("change", update);
		return () => query.removeEventListener("change", update);
	}, []);

	return isCoarse;
}
