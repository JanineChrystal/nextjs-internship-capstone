"use client";

import { useEffect, useState } from "react";

/** coarse pointer - whether the primary input is a finger. Not a width check: a tablet at 900px has a phone's touch limits, and useIsMobile's 768px line left tablets broken. */
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
