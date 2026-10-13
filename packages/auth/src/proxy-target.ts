import { symmetricDecrypt } from "better-auth/crypto";

// Previews are served from pr-<number>.preview.codesphereplatform.xyz (preview.yml).
const PREVIEW_SUFFIX = ".preview.codesphereplatform.xyz";

/**
 * Whether the staging proxy may send a member back to `target`: the staging origin itself, or
 * one preview (a single label under the preview domain). Anything else is refused (#149).
 */
export function isAllowedProxyTarget(
	target: string,
	stagingOrigin: string,
): boolean {
	let url: URL;
	try {
		url = new URL(target);
	} catch {
		return false;
	}
	if (url.protocol !== "https:") {
		return false;
	}
	if (url.origin === stagingOrigin) {
		return true;
	}
	if (!url.hostname.endsWith(PREVIEW_SUFFIX)) {
		return false;
	}
	const label = url.hostname.slice(0, -PREVIEW_SUFFIX.length);
	return label.length > 0 && !label.includes(".");
}

/**
 * The callback URL the proxy will redirect to, read from the `state` the provider sent back.
 * Null when the state is not a proxy state this secret can open; the plugin then decides.
 */
export async function proxyTargetOf(
	state: string,
	secret: string,
): Promise<string | null> {
	try {
		const pkg = JSON.parse(
			await symmetricDecrypt({ key: secret, data: state }),
		);
		if (!pkg.isOAuthProxy || typeof pkg.stateCookie !== "string") {
			return null;
		}
		const data = JSON.parse(
			await symmetricDecrypt({ key: secret, data: pkg.stateCookie }),
		);
		return typeof data.callbackURL === "string" ? data.callbackURL : null;
	} catch {
		return null;
	}
}
