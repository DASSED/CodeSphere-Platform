"use client";

import { CONSENT_COOKIE } from "@codesphere/contract/consent";
import type { SsoProvider } from "@codesphere/ui/components/molecules/provider-button";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

// The consent version travels in a short-lived cookie that the server reads when it creates the
// account (#63): without it, no account is created.
const CONSENT_COOKIE_MAX_AGE_SECONDS = 600;

/**
 * SSO sign-in shared by /signin and the header's LoginDialog. Every success lands on
 * /post-signin, which sends an Admin to /admin and any other Member home (#121).
 */
export function useSsoSignIn(initialError?: string) {
	const t = useTranslations("signin");
	const [pending, setPending] = useState<SsoProvider | null>(null);
	const [error, setError] = useState<string | undefined>(initialError);

	const onProviderSelect = async (
		provider: SsoProvider,
		consent: { version: string },
	) => {
		document.cookie = `${CONSENT_COOKIE}=${consent.version}; path=/; max-age=${CONSENT_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
		setError(undefined);
		setPending(provider);
		try {
			const { error: authError } = await authClient.signIn.social({
				provider,
				callbackURL: "/post-signin",
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
	};

	return { pending, error, setError, onProviderSelect };
}
