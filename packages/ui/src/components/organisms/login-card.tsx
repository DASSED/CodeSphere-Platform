"use client";

import { Button } from "@codesphere/ui/components/atoms/button";
import { Checkbox } from "@codesphere/ui/components/atoms/checkbox";
import { Input } from "@codesphere/ui/components/atoms/input";
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

/** Sign in with a one-time code sent by email. Each call resolves to an error message, or nothing. */
type EmailSignIn = {
	onRequestCode: (
		email: string,
		consent: Consent,
	) => Promise<string | undefined>;
	onVerifyCode: (
		email: string,
		code: string,
		consent: Consent,
	) => Promise<string | undefined>;
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
	/** Adds an « email + code » sign-in under the providers (local development, previews). */
	emailSignIn?: EmailSignIn;
	/** Hide the heading when the card sits inside a dialog that has its own. */
	hideHeading?: boolean;
};

/** Sign in with SSO, plus an opt-in email code outside production. The consent box starts unchecked and gates both (spec §3, Authentification). */
function LoginCard({
	onProviderSelect,
	providers = ["github", "gitlab", "google"],
	consentVersion,
	termsHref = "/legal/terms",
	privacyHref = "/legal/privacy",
	pendingProvider = null,
	error,
	hideHeading = false,
	emailSignIn,
	className,
	...props
}: LoginCardProps) {
	const consentId = useId();
	const [accepted, setAccepted] = useState(false);
	const [email, setEmail] = useState("");
	const [code, setCode] = useState("");
	const [codeSent, setCodeSent] = useState(false);
	const [busy, setBusy] = useState(false);
	const [emailError, setEmailError] = useState<string>();
	const consent = (): Consent => ({
		version: consentVersion,
		acceptedAt: new Date().toISOString(),
	});

	const submitEmail = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!emailSignIn || busy) {
			return;
		}
		setBusy(true);
		setEmailError(undefined);
		const message = codeSent
			? await emailSignIn.onVerifyCode(email, code, consent())
			: await emailSignIn.onRequestCode(email, consent());
		setBusy(false);
		if (message) {
			setEmailError(message);
		} else if (!codeSent) {
			setCodeSent(true);
		}
	};

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

			{emailSignIn && (
				<form
					onSubmit={submitEmail}
					className="flex flex-col gap-2 border-t pt-4"
					aria-label="Connexion par code email"
				>
					<Label htmlFor={`${consentId}-email`}>
						Ou avec un code par email
					</Label>
					<Input
						id={`${consentId}-email`}
						type="email"
						autoComplete="email"
						placeholder="vous@exemple.com"
						value={email}
						onChange={(event) => setEmail(event.target.value)}
						disabled={!accepted || busy || codeSent}
						required
					/>
					{codeSent && (
						<>
							<Label htmlFor={`${consentId}-code`}>Code reçu par email</Label>
							<Input
								id={`${consentId}-code`}
								inputMode="numeric"
								autoComplete="one-time-code"
								placeholder="123456"
								maxLength={6}
								value={code}
								onChange={(event) => setCode(event.target.value)}
								disabled={busy}
								required
							/>
						</>
					)}
					{emailError && (
						<p role="alert" className="text-destructive text-xs">
							{emailError}
						</p>
					)}
					<Button type="submit" disabled={!accepted || busy}>
						{codeSent ? "Valider le code" : "Envoyer le code"}
					</Button>
				</form>
			)}

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

export { type Consent, type EmailSignIn, LoginCard, type LoginCardProps };
