"use client";

import { Button } from "@codesphere/ui/components/atoms/button";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

/** Switches between the light and the dark theme. Both icons are in the DOM and CSS picks one, so it never mismatches on hydration. */
function ThemeToggle({
	className,
	...props
}: Omit<React.ComponentProps<typeof Button>, "onClick" | "children">) {
	const { resolvedTheme, setTheme } = useTheme();
	return (
		<Button
			type="button"
			variant="ghost"
			size="icon"
			aria-label="Changer de thème"
			data-slot="theme-toggle"
			className={className}
			onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
			{...props}
		>
			<SunIcon className="dark:hidden" />
			<MoonIcon className="hidden dark:block" />
		</Button>
	);
}

export { ThemeToggle };
