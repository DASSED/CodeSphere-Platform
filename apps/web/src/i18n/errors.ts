// Standard oRPC error codes that the UI can translate (spec §3). The message key lives in
// messages/<locale>.json under "errors"; anything else falls back to the generic message.
export const ERROR_CODES = [
	"UNAUTHORIZED",
	"FORBIDDEN",
	"NOT_FOUND",
	"CONFLICT",
	"BAD_REQUEST",
	"TOO_MANY_REQUESTS",
	"INTERNAL_SERVER_ERROR",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export function toErrorCode(code: string | undefined): ErrorCode {
	return ERROR_CODES.find((known) => known === code) ?? "INTERNAL_SERVER_ERROR";
}
