// Resend delivers its webhooks through Svix (#200): each request is signed with HMAC-SHA256 over
// `${svix-id}.${svix-timestamp}.${body}`, keyed by the base64 part of the `whsec_` secret.
// WebCrypto only, so the check runs the same on Bun and on the Cloudflare Worker.
import type { Logger } from "@codesphere/logger";

/** Older deliveries are refused, so a captured request cannot be replayed later. */
const TOLERANCE_SECONDS = 5 * 60;

const fromBase64 = (value: string) =>
	Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

const toBase64 = (bytes: ArrayBuffer) =>
	btoa(String.fromCharCode(...new Uint8Array(bytes)));

// Compares without stopping at the first difference, so timing reveals nothing.
const constantTimeEqual = (a: string, b: string) => {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return diff === 0;
};

/**
 * The events worth a trace: Resend accepted the email, then it never arrived (bounced,
 * suppressed) or the recipient reported it as spam (complained).
 */
const DELIVERY_PROBLEMS = new Set([
	"email.bounced",
	"email.suppressed",
	"email.complained",
]);

type ResendEvent = {
	type?: string;
	data?: { email_id?: string; bounce?: { type?: string; subType?: string } };
};

/**
 * Handles one webhook delivery: refuses an unsigned one (401) and logs an undelivered email by
 * its Resend id, never by address (spec §4), so a support request can be matched to the event.
 */
export async function handleResendWebhook(
	request: Request,
	secret: string,
	logger: Pick<Logger, "warn">,
): Promise<Response> {
	const body = await request.text();
	if (!(await verifyResendWebhook(secret, request.headers, body))) {
		return new Response(null, { status: 401 });
	}
	let event: ResendEvent;
	try {
		event = JSON.parse(body) as ResendEvent;
	} catch {
		return new Response(null, { status: 400 });
	}
	if (event.type && DELIVERY_PROBLEMS.has(event.type)) {
		logger.warn(
			{
				event: event.type,
				emailId: event.data?.email_id,
				bounceType: event.data?.bounce?.type,
				bounceSubType: event.data?.bounce?.subType,
			},
			"email delivery problem",
		);
	}
	// Every other event is acknowledged so Resend does not retry it.
	return new Response(null, { status: 204 });
}

/** True when `body` was signed by Resend with `secret` less than five minutes before `now`. */
export async function verifyResendWebhook(
	secret: string,
	headers: Headers,
	body: string,
	now = Math.floor(Date.now() / 1000),
): Promise<boolean> {
	const id = headers.get("svix-id");
	const timestamp = headers.get("svix-timestamp");
	const signatures = headers.get("svix-signature");
	if (!id || !timestamp || !signatures) return false;
	const sentAt = Number(timestamp);
	if (!Number.isFinite(sentAt) || Math.abs(now - sentAt) > TOLERANCE_SECONDS) {
		return false;
	}

	const key = await crypto.subtle.importKey(
		"raw",
		fromBase64(secret.replace(/^whsec_/, "")),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const expected = toBase64(
		await crypto.subtle.sign(
			"HMAC",
			key,
			new TextEncoder().encode(`${id}.${timestamp}.${body}`),
		),
	);
	// A rotated secret sends several `v1,<signature>` entries: one match is enough.
	return signatures
		.split(" ")
		.some((entry) => constantTimeEqual(entry.replace(/^v1,/, ""), expected));
}
