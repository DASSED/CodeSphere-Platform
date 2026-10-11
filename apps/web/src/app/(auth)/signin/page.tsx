"use client";

import { CONSENT_VERSION } from "@codesphere/contract/consent";
import { LoginPage } from "@codesphere/ui/components/organisms/login-page";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { authClient } from "@/lib/auth-client";
import { signInErrorKey } from "@/lib/sign-in-error";
import { useSsoSignIn } from "@/lib/use-sso-sign-in";

// SSO sign-in page (spec §3: GitHub, GitLab, Google; consent unchecked at first sign-in).
export default function SignInPage() {
	const t = useTranslations("signin");
	const router = useRouter();
	const { pending, error, setError, onProviderSelect } = useSsoSignIn();
	const { data: session } = authClient.useSession();

	// A Member already signed in has nothing to do here (#121).
	useEffect(() => {
		if (session?.user) {
			router.replace("/post-signin");
		}
	}, [session, router]);

	// A failed OAuth callback comes back here with `?error=<code>`.
	useEffect(() => {
		const key = signInErrorKey(
			new URLSearchParams(window.location.search).get("error"),
		);
		if (key) {
			setError(t(key));
		}
	}, [t, setError]);

	return (
		<LoginPage
			card={{
				consentVersion: CONSENT_VERSION,
				pendingProvider: pending,
				error,
				onProviderSelect,
			}}
		/>
	);
}
