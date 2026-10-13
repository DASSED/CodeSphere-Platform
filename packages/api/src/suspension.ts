import type { Session } from "@codesphere/auth";

/** True when the session's Member is suspended (#123). */
export function isSuspended(session: Session | null): boolean {
	const user = session?.user as
		| { suspendedAt?: Date | string | null }
		| undefined;
	return Boolean(user?.suspendedAt);
}

/**
 * A suspended Member's API keys stop being accepted (#123): the request is anonymous, so the
 * procedures answer UNAUTHORIZED. The web session survives so the Member can still read.
 */
export function sessionForRequest(
	session: Session | null,
	viaApiKey: boolean,
): Session | null {
	return viaApiKey && isSuspended(session) ? null : session;
}

/** Whether the request carried an API key (`x-api-key`, or a Bearer token as MCP clients send). */
export function carriesApiKey(headers: Headers): boolean {
	return (
		Boolean(headers.get("x-api-key")) ||
		Boolean(headers.get("authorization")?.startsWith("Bearer "))
	);
}
