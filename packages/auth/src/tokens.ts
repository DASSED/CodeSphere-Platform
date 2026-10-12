// OAuth tokens are not kept (spec §3): the provider is only used to prove identity, so the
// account row keeps the link (provider, account id) and nothing that could act for the member.
const TOKEN_FIELDS = [
	"accessToken",
	"refreshToken",
	"idToken",
	"accessTokenExpiresAt",
	"refreshTokenExpiresAt",
] as const;

type TokenFields = (typeof TOKEN_FIELDS)[number];

export function withoutOAuthTokens<T extends object>(
	account: T,
): Omit<T, TokenFields> & Record<TokenFields, null> {
	const cleared = Object.fromEntries(
		TOKEN_FIELDS.map((field) => [field, null]),
	) as Record<TokenFields, null>;
	return { ...account, ...cleared };
}
