"use client";

import { Button } from "@codesphere/ui/components/atoms/button";
import { AdminShell } from "@codesphere/ui/components/organisms/admin-shell";
import {
	BarChart3Icon,
	LogOutIcon,
	ScrollTextIcon,
	ShieldIcon,
	TagIcon,
	TrophyIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { useAdminIdentity } from "@/components/admin-identity";
import LocaleSwitcher from "@/components/locale-switcher";
import { authClient } from "@/lib/auth-client";

const NAV = [
	{ key: "moderation", href: "/admin", icon: ShieldIcon },
	{ key: "hackathons", href: "/admin/hackathons", icon: TrophyIcon },
	{ key: "tags", href: "/admin/tags", icon: TagIcon },
	{ key: "kpi", href: "/dashboard", icon: BarChart3Icon },
	{ key: "audit", href: "/admin/audit", icon: ScrollTextIcon },
] as const;

/** The back-office layout with the navigation wired to the router and the signed-in Admin. */
export default function AdminFrame({
	title,
	description,
	actions,
	children,
}: {
	title: string;
	description?: string;
	actions?: React.ReactNode;
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const router = useRouter();
	const identity = useAdminIdentity();
	const t = useTranslations("admin");

	const signOut = () =>
		authClient.signOut({
			fetchOptions: { onSuccess: () => router.push("/") },
		});

	return (
		<AdminShell
			title={title}
			description={description}
			LinkComponent={Link}
			user={
				identity
					? {
							name: identity.name,
							email: identity.email,
							role: identity.role,
						}
					: undefined
			}
			nav={NAV.map(({ key, ...item }) => ({
				...item,
				label: t(key),
				active: pathname === item.href,
			}))}
			actions={
				<>
					<LocaleSwitcher />
					{actions}
					<Button variant="ghost" size="sm" onClick={signOut}>
						<LogOutIcon />
						{t("signOut")}
					</Button>
				</>
			}
		>
			{children}
		</AdminShell>
	);
}
