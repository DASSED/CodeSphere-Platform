"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type * as React from "react";

// next-themes inlines a script that sets the theme before the first paint. It only has to run
// from the server HTML: on the client, React 19 warns about any script a component renders, so
// it is rendered there as a data block (never executed, no warning) with the same content.
const scriptProps =
	typeof window === "undefined"
		? undefined
		: ({ type: "application/json", suppressHydrationWarning: true } as const);

export function ThemeProvider({
	children,
	...props
}: React.ComponentProps<typeof NextThemesProvider>) {
	return (
		<NextThemesProvider scriptProps={scriptProps} {...props}>
			{children}
		</NextThemesProvider>
	);
}
