"use client";

import type { SsoProvider } from "@codesphere/ui/components/molecules/provider-button";
import { LoginPage } from "@codesphere/ui/components/organisms/login-page";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

// SSO sign-in page (spec §3: GitHub, GitLab, Google; consent unchecked at first sign-in).
// The providers must be configured on the server (#63) before the buttons can succeed, and the
// consent (date and version) is not stored yet: it is only passed to the handler.
export default function SignInPage() {
	const [pending, setPending] = useState<SsoProvider | null>(null);
	const [error, setError] = useState<string>();

	return (
		<LoginPage
			card={{
				consentVersion: "2026-10",
				pendingProvider: pending,
				error,
				onProviderSelect: async (provider) => {
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
