"use client";

import { Button } from "@codesphere/ui/components/atoms/button";
import { AppHeader } from "@codesphere/ui/components/organisms/app-header";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import LocaleSwitcher from "@/components/locale-switcher";
import SsoLoginDialog from "@/components/sso-login-dialog";
import UserMenu from "@/components/user-menu";
import { authClient } from "@/lib/auth-client";

/** « Poser une question »: opens the sign-in for a visitor; the form itself is another ticket. */
export function AskButton({ className }: { className?: string }) {
	const t = useTranslations("header");
	const { data: session } = authClient.useSession();
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
	return (
		<AppHeader
			actions={
				<>
					<LocaleSwitcher />
					<AskButton />
					<UserMenu />
				</>
			}
		/>
	);
}
