"use client";

import { CONSENT_VERSION } from "@codesphere/contract/consent";
import { LoginDialog } from "@codesphere/ui/components/organisms/login-dialog";

import { useSsoSignIn } from "@/lib/use-sso-sign-in";

/** The SSO LoginDialog wired to Better Auth; `trigger` is the element that opens it. */
export default function SsoLoginDialog({
	trigger,
}: {
	trigger?: React.ReactElement;
}) {
	const { pending, error, onProviderSelect } = useSsoSignIn();
	return (
		<LoginDialog
			trigger={trigger}
			consentVersion={CONSENT_VERSION}
			pendingProvider={pending}
			error={error}
			onProviderSelect={onProviderSelect}
		/>
	);
}
