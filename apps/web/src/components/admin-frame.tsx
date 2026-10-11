"use client";

import { Button } from "@codesphere/ui/components/atoms/button";
import { AdminShell } from "@codesphere/ui/components/organisms/admin-shell";
import {
	ArrowLeftIcon,
	BarChart3Icon,
	LogOutIcon,
	ScrollTextIcon,
	ShieldIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAdminIdentity } from "@/components/admin-identity";
import { authClient } from "@/lib/auth-client";

const NAV = [
	{ label: "Modération", href: "/admin", icon: ShieldIcon },
	{ label: "KPI", href: "/admin/kpi", icon: BarChart3Icon },
	{ label: "Journal d'audit", href: "/admin/audit", icon: ScrollTextIcon },
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
				identity ? { name: identity.name, role: identity.email } : undefined
			}
			nav={NAV.map((item) => ({ ...item, active: pathname === item.href }))}
			actions={
				<>
					{actions}
					<Button
						variant="ghost"
						size="sm"
						render={<Link href="/" />}
						nativeButton={false}
					>
						<ArrowLeftIcon />
						Retour au site
					</Button>
					<Button variant="ghost" size="sm" onClick={signOut}>
						<LogOutIcon />
						Se déconnecter
					</Button>
				</>
			}
		>
			{children}
		</AdminShell>
	);
}
