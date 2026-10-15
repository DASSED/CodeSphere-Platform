import { describe, expect, test } from "bun:test";
import { createHmac } from "node:crypto";

import { verifyResendWebhook } from "./resend-webhook";

// Svix signs `${id}.${timestamp}.${body}` with the base64 key after `whsec_`.
const key = Buffer.from("resend-webhook-test-key-32-bytes!");
const secret = `whsec_${key.toString("base64")}`;
const body = JSON.stringify({
	type: "email.bounced",
	data: { email_id: "m1" },
});
const now = 1_800_000_000;

const sign = (timestamp: number, payload = body, signingKey = key) =>
	`v1,${createHmac("sha256", signingKey).update(`msg_1.${timestamp}.${payload}`).digest("base64")}`;

const headers = (signature: string, timestamp = now) =>
	new Headers({
		"svix-id": "msg_1",
		"svix-timestamp": String(timestamp),
		"svix-signature": signature,
	});

describe("verifyResendWebhook", () => {
	test("accepts a body signed with the secret", async () => {
		expect(
			await verifyResendWebhook(secret, headers(sign(now)), body, now),
		).toBe(true);
	});

	test("accepts when one of several signatures matches (key rotation)", async () => {
		const both = `v1,bm90LXRoZS1yaWdodC1vbmU= ${sign(now)}`;
		expect(await verifyResendWebhook(secret, headers(both), body, now)).toBe(
			true,
		);
	});

	test("refuses a tampered body", async () => {
		expect(
			await verifyResendWebhook(secret, headers(sign(now)), `${body} `, now),
		).toBe(false);
	});

	test("refuses a signature made with another key", async () => {
		const other = sign(now, body, Buffer.from("another-key"));
		expect(await verifyResendWebhook(secret, headers(other), body, now)).toBe(
			false,
		);
	});

	test("refuses a delivery older than five minutes (replay)", async () => {
		const old = now - 6 * 60;
		expect(
			await verifyResendWebhook(secret, headers(sign(old), old), body, now),
		).toBe(false);
	});

	test("refuses a request without the Svix headers", async () => {
		expect(await verifyResendWebhook(secret, new Headers(), body, now)).toBe(
			false,
		);
	});
});
