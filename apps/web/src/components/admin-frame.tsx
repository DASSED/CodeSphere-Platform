"use client";

import { AdminShell } from "@codesphere/ui/components/organisms/admin-shell";
import { BarChart3Icon, ScrollTextIcon, ShieldIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
	{ label: "Modération", href: "/admin", icon: ShieldIcon },
	{ label: "KPI", href: "/admin/kpi", icon: BarChart3Icon },
	{ label: "Journal d'audit", href: "/admin/audit", icon: ScrollTextIcon },
] as const;

/** The back-office layout with the navigation wired to the router. */
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
	return (
		<AdminShell
			title={title}
			description={description}
			actions={actions}
			LinkComponent={Link}
			user={{ name: "Administrateur", role: "Accès administrateur" }}
			nav={NAV.map((item) => ({ ...item, active: pathname === item.href }))}
		>
			{children}
		</AdminShell>
	);
}
