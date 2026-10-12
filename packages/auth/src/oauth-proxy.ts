export type OAuthProxyEnv = {
	OAUTH_PROXY_SECRET?: string;
	OAUTH_PROXY_PRODUCTION_URL?: string;
};

export type OAuthProxyOptions = {
	secret: string;
	productionURL: string;
	maxAge: number;
};

const MIN_SECRET_LENGTH = 32;

// The identity providers only know one callback URL: the staging origin
// (OAUTH_PROXY_PRODUCTION_URL). Every other deployment (a preview per pull request) sends the
// member through it and gets the profile handed back, encrypted with a shared secret.
//
// Both values must be set, on staging as well as on each preview: staging needs the plugin to
// relay the callback, the previews to hand over. The production deployment sets neither, so
// the proxy does not exist there.
export function oauthProxyFrom(env: OAuthProxyEnv): OAuthProxyOptions | null {
	const secret = env.OAUTH_PROXY_SECRET;
	const production = env.OAUTH_PROXY_PRODUCTION_URL;
	if (!secret && !production) {
		return null;
	}
	if (!secret || !production) {
		throw new Error(
			"OAUTH_PROXY_SECRET and OAUTH_PROXY_PRODUCTION_URL must be set together",
		);
	}
	if (secret.length < MIN_SECRET_LENGTH) {
		throw new Error(
			`OAUTH_PROXY_SECRET must be at least ${MIN_SECRET_LENGTH} characters`,
		);
	}
	const url = new URL(production);
	if (url.protocol !== "https:") {
		throw new Error("OAUTH_PROXY_PRODUCTION_URL must be an https origin");
	}
	return {
		secret,
		// Origin only: the plugin appends the auth base path itself.
		productionURL: url.origin,
		// Short on purpose: the payload only has to survive one redirect (replay window).
		maxAge: 60,
	};
}
