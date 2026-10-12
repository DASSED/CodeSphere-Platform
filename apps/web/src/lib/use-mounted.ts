"use client";

import { useEffect, useState } from "react";

/**
 * False during the server render and the first client render, true afterwards. Gates what
 * depends on the viewer's clock, timezone or locale, so the server markup never mismatches.
 */
export function useMounted() {
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	return mounted;
}
