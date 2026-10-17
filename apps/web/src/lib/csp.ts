// Content Security Policy of every page (#54, spec §4). The proxy (src/proxy.ts) draws a nonce per
// request; Next.js puts it on its own scripts, the layout hands it to next-themes. 'strict-dynamic'
// lets those trusted scripts load the chunks they need, and nothing else runs.
//
// Styles keep 'unsafe-inline': React style attributes, next-themes and sonner write inline styles,
// and a nonce cannot cover a style attribute. Script injection stays blocked, which is what matters.

export type CspOptions = {
	nonce: string;
	/** `next dev`: React needs eval for its debugging, the dev server a WebSocket. */
	dev: boolean;
	/** NEXT_PUBLIC_SERVER_URL, when the API lives on another origin (local development). */
	serverUrl?: string;
};

/** Origin of `url`, or undefined when it is empty or not a URL. */
function originOf(url: string | undefined): string | undefined {
	if (!url) {
		return undefined;
	}
	try {
		return new URL(url).origin;
	} catch {
		return undefined;
	}
}

export function buildCsp({ nonce, dev, serverUrl }: CspOptions): string {
	const api = originOf(serverUrl);
	const directives: Record<string, string[]> = {
		"default-src": ["'self'"],
		"script-src": [
			"'self'",
			`'nonce-${nonce}'`,
			"'strict-dynamic'",
			...(dev ? ["'unsafe-eval'"] : []),
		],
		"style-src": ["'self'", "'unsafe-inline'"],
		// Avatars come from the sign-in providers (GitHub, GitLab, Google); Markdown has no images.
		"img-src": ["'self'", "data:", "blob:", "https:"],
		"font-src": ["'self'", "data:"],
		"connect-src": [
			"'self'",
			...(api ? [api] : []),
			...(dev ? ["ws:", "wss:"] : []),
		],
		"worker-src": ["'self'", "blob:"],
		"manifest-src": ["'self'"],
		"object-src": ["'none'"],
		"base-uri": ["'self'"],
		"form-action": ["'self'"],
		"frame-ancestors": ["'none'"],
	};
	return Object.entries(directives)
		.map(([name, values]) => `${name} ${values.join(" ")}`)
		.join("; ");
}

/** Headers sent with every page, also where Caddy does not sit in front (Cloudflare previews). */
export const SECURITY_HEADERS: Record<string, string> = {
	"X-Content-Type-Options": "nosniff",
	"Referrer-Policy": "strict-origin-when-cross-origin",
	"Permissions-Policy": "camera=(), microphone=(), geolocation=()",
	"X-Frame-Options": "DENY",
	"Cross-Origin-Opener-Policy": "same-origin",
};

/** A fresh nonce: 128 random bits, base64. */
export function createNonce(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(16));
	return btoa(String.fromCharCode(...bytes));
}
