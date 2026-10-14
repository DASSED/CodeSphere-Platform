"use client";

import { isStaffRole } from "@codesphere/contract/roles";
import { Button } from "@codesphere/ui/components/atoms/button";
import { Skeleton } from "@codesphere/ui/components/atoms/skeleton";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@codesphere/ui/components/molecules/dropdown-menu";
import { LogOutIcon, SettingsIcon, ShieldIcon, UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import SsoLoginDialog from "@/components/sso-login-dialog";
import { authClient } from "@/lib/auth-client";
import { useHydratedSession } from "@/lib/use-hydrated-session";

function initials(name: string) {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part.charAt(0).toUpperCase())
		.join("");
}

/** Visitor: « Se connecter » opens the SSO dialog. Member: the account menu (#129). */
export default function UserMenu() {
	const t = useTranslations("header");
	const router = useRouter();
	const { data: session, isPending } = useHydratedSession();

	if (isPending) {
		return <Skeleton className="size-9 rounded-full" />;
	}

	if (!session) {
		return (
			<SsoLoginDialog
				trigger={<Button variant="outline">{t("signIn")}</Button>}
			/>
		);
	}

	const { user } = session;
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<button
						type="button"
						aria-label={t("account")}
						className="grid size-9 place-items-center rounded-full bg-linear-to-br from-primary to-amber-600 font-bold text-primary-foreground text-xs ring-2 ring-background ring-offset-1 ring-offset-primary"
					/>
				}
			>
				{initials(user.name)}
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-56 bg-card">
				<DropdownMenuGroup>
					<DropdownMenuLabel>
						<span className="block font-semibold text-foreground">
							{user.name}
						</span>
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem onClick={() => router.push("/settings")}>
						<UserIcon />
						{t("profile")}
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => router.push("/settings")}>
						<SettingsIcon />
						{t("settings")}
					</DropdownMenuItem>
					{isStaffRole(user.role) && (
						<DropdownMenuItem onClick={() => router.push("/admin")}>
							<ShieldIcon />
							{t("admin")}
						</DropdownMenuItem>
					)}
					<DropdownMenuSeparator />
					<DropdownMenuItem
						variant="destructive"
						onClick={() =>
							authClient.signOut({
								fetchOptions: { onSuccess: () => router.push("/") },
							})
						}
					>
						<LogOutIcon />
						{t("signOut")}
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
