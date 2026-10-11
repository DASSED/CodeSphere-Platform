"use client";

import type { SsoProvider } from "@codesphere/ui/components/molecules/provider-button";
import { LoginPage } from "@codesphere/ui/components/organisms/login-page";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

// SSO sign-in page (spec §3: GitHub, GitLab, Google; consent unchecked at first sign-in).
// The consent version travels in a short-lived cookie that the server reads when it creates the
// account (#63): without it, no account is created.
const CONSENT_COOKIE_MAX_AGE_SECONDS = 600;
export default function SignInPage() {
	const [pending, setPending] = useState<SsoProvider | null>(null);
	const [error, setError] = useState<string>();

	return (
		<LoginPage
			card={{
				consentVersion: "2026-10",
				pendingProvider: pending,
				error,
				onProviderSelect: async (provider, consent) => {
					document.cookie = `consent_version=${consent.version}; path=/; max-age=${CONSENT_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
					setError(undefined);
					setPending(provider);
					try {
						const { error: authError } = await authClient.signIn.social({
							provider,
							callbackURL: "/dashboard",
						});
						if (authError) {
							setError(authError.message ?? "La connexion a échoué.");
							setPending(null);
						}
					} catch {
						setError("Impossible de joindre le serveur d'authentification.");
						setPending(null);
					}
				},
			}}
		/>
	);
}
