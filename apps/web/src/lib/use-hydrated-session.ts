"use client";

import { authClient } from "@/lib/auth-client";
import { useMounted } from "@/lib/use-mounted";

/**
 * `authClient.useSession()`, held at « pending, no session » until mounted. The server always
 * renders the pending state, while the client may already hold a resolved session on its first
 * render: gating on mount keeps the first client render equal to the server markup.
 */
export function useHydratedSession() {
	const mounted = useMounted();
	const { data, isPending } = authClient.useSession();
	return mounted
		? { data, isPending }
		: { data: null as typeof data, isPending: true };
}
