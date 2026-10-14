/**
 * Base URL of the API.
 *
 * On the server (Docker), the internal one (SERVER_URL). In the browser, the public one
 * (NEXT_PUBLIC_SERVER_URL) or, when that is empty, the host the page was loaded from: production
 * serves the web app and the API on each public host, so the browser stays on that origin.
 */
export function getServerUrl() {
	const browser = typeof window !== "undefined";
	const url =
		!browser && process.env.SERVER_URL
			? process.env.SERVER_URL
			: process.env.NEXT_PUBLIC_SERVER_URL ||
				(browser ? window.location.origin : "");
	return url.endsWith("/") ? url.slice(0, -1) : url;
}
