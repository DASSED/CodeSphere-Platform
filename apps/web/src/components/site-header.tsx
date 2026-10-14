"use client";

import { Button } from "@codesphere/ui/components/atoms/button";
import { ThemeToggle } from "@codesphere/ui/components/molecules/theme-toggle";
import { AppHeader } from "@codesphere/ui/components/organisms/app-header";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import LocaleSwitcher from "@/components/locale-switcher";
import SsoLoginDialog from "@/components/sso-login-dialog";
import UserMenu from "@/components/user-menu";
import { useHydratedSession } from "@/lib/use-hydrated-session";

/** « Poser une question »: opens the sign-in for a visitor; the form itself is another ticket. */
export function AskButton({ className }: { className?: string }) {
	const t = useTranslations("header");
	const { data: session } = useHydratedSession();
	const content = (
		<>
			<PlusIcon />
			<span className="max-sm:sr-only">{t("ask")}</span>
		</>
	);
	if (!session) {
		return (
			<SsoLoginDialog
				trigger={<Button className={className}>{content}</Button>}
			/>
		);
	}
	return (
		<Button className={className} disabled title={t("askSoon")}>
			{content}
		</Button>
	);
}

/** The site's bar (#129): logo, language, « Poser une question », then the account. No feed tabs here. */
export default function SiteHeader() {
	const t = useTranslations("header");
	return (
		<AppHeader
			actions={
				<>
					<ThemeToggle aria-label={t("toggleTheme")} />
					<LocaleSwitcher />
					<AskButton />
					<UserMenu />
				</>
			}
		/>
	);
}
