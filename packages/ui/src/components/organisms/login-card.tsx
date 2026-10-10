"use client";

import { Checkbox } from "@codesphere/ui/components/atoms/checkbox";
import { Label } from "@codesphere/ui/components/atoms/label";
import {
	Alert,
	AlertDescription,
} from "@codesphere/ui/components/molecules/alert";
import {
	ProviderButton,
	type SsoProvider,
} from "@codesphere/ui/components/molecules/provider-button";
import { cn } from "@codesphere/ui/lib/utils";
import { TriangleAlertIcon } from "lucide-react";
import { useId, useState } from "react";

type Consent = {
	/** Version of the terms the member accepted. */
	version: string;
	/** ISO date of the acceptance. */
	acceptedAt: string;
};

type LoginCardProps = Omit<React.ComponentProps<"div">, "children"> & {
	/** Called with the chosen provider and the consent, recorded with its date and version. */
	onProviderSelect: (provider: SsoProvider, consent: Consent) => void;
	providers?: readonly SsoProvider[];
	consentVersion: string;
	termsHref?: string;
	privacyHref?: string;
	/** Provider the member was sent to; the buttons are disabled while it redirects. */
	pendingProvider?: SsoProvider | null;
	error?: string;
	/** Hide the heading when the card sits inside a dialog that has its own. */
	hideHeading?: boolean;
};

/** Sign in with SSO only. The consent box starts unchecked and gates the providers (spec §3, Authentification). */
function LoginCard({
	onProviderSelect,
	providers = ["github", "gitlab", "google"],
	consentVersion,
	termsHref = "/legal/terms",
	privacyHref = "/legal/privacy",
	pendingProvider = null,
	error,
	hideHeading = false,
	className,
	...props
}: LoginCardProps) {
	const consentId = useId();
	const [accepted, setAccepted] = useState(false);

	return (
		<div
			data-slot="login-card"
			className={cn("flex w-full flex-col gap-5", className)}
			{...props}
		>
			{!hideHeading && (
				<div className="flex flex-col gap-1">
					<h2 className="font-semibold text-2xl tracking-tight">
						Se connecter
					</h2>
					<p className="text-muted-foreground text-sm">
						Choisissez le compte avec lequel vous voulez rejoindre CodeSphere.
					</p>
				</div>
			)}

			{error && (
				<Alert variant="destructive">
					<TriangleAlertIcon />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			<div className="flex flex-col gap-2">
				{providers.map((provider) => (
					<ProviderButton
						key={provider}
						provider={provider}
						disabled={!accepted || pendingProvider !== null}
						aria-busy={pendingProvider === provider}
						onClick={() =>
							onProviderSelect(provider, {
								version: consentVersion,
								acceptedAt: new Date().toISOString(),
							})
						}
					/>
				))}
			</div>

			<div className="flex items-start gap-2">
				<Checkbox
					id={consentId}
					checked={accepted}
					onCheckedChange={(checked) => setAccepted(checked === true)}
					className="mt-0.5"
				/>
				<Label
					htmlFor={consentId}
					className="font-normal text-muted-foreground text-xs leading-relaxed"
				>
					<span>
						J'accepte les{" "}
						<a
							href={termsHref}
							className="text-foreground underline underline-offset-2"
						>
							conditions d'utilisation
						</a>{" "}
						et la{" "}
						<a
							href={privacyHref}
							className="text-foreground underline underline-offset-2"
						>
							politique de confidentialité
						</a>{" "}
						(version {consentVersion}).
					</span>
				</Label>
			</div>
			{!accepted && (
				<p className="-mt-3 text-muted-foreground text-xs">
					Cochez la case pour activer la connexion.
				</p>
			)}
		</div>
	);
}

export { type Consent, LoginCard, type LoginCardProps };
