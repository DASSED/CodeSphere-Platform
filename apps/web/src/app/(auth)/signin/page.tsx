"use client";

import { CONSENT_COOKIE, CONSENT_VERSION } from "@codesphere/contract/consent";
import type { SsoProvider } from "@codesphere/ui/components/molecules/provider-button";
import { LoginPage } from "@codesphere/ui/components/organisms/login-page";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { signInErrorKey } from "@/lib/sign-in-error";

// SSO sign-in page (spec §3: GitHub, GitLab, Google; consent unchecked at first sign-in).
// The consent version travels in a short-lived cookie that the server reads when it creates the
// account (#63): without it, no account is created.
const CONSENT_COOKIE_MAX_AGE_SECONDS = 600;

export default function SignInPage() {
	const t = useTranslations("signin");
	const [pending, setPending] = useState<SsoProvider | null>(null);
	const [error, setError] = useState<string>();

	// A failed OAuth callback comes back here with `?error=<code>`.
	useEffect(() => {
		const key = signInErrorKey(
			new URLSearchParams(window.location.search).get("error"),
		);
		if (key) {
			setError(t(key));
		}
	}, [t]);

	return (
		<LoginPage
			card={{
				consentVersion: CONSENT_VERSION,
				pendingProvider: pending,
				error,
				onProviderSelect: async (provider, consent) => {
					document.cookie = `${CONSENT_COOKIE}=${consent.version}; path=/; max-age=${CONSENT_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
					setError(undefined);
					setPending(provider);
					try {
						const { error: authError } = await authClient.signIn.social({
							provider,
							callbackURL: "/dashboard",
							errorCallbackURL: "/signin",
						});
						if (authError) {
							setError(authError.message ?? t("failed"));
							setPending(null);
						}
					} catch {
						setError(t("unreachable"));
						setPending(null);
					}
				},
			}}
		/>
	);
}
