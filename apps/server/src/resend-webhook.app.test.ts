// POST /webhooks/resend (#200): Resend tells the API about emails it accepted but never delivered.
import { describe, expect, test } from "bun:test";
import { createHmac } from "node:crypto";
import { createLogger } from "@codesphere/logger";

import { createApp } from "./app";

const key = Buffer.from("resend-webhook-test-key-32-bytes!");
const secret = `whsec_${key.toString("base64")}`;

const appWith = (resendWebhookSecret?: string) => {
	const lines: Record<string, unknown>[] = [];
	const app = createApp({
		// The webhook never reaches auth nor the database; any other request is an anonymous visitor.
		auth: { api: { getSession: async () => null } } as never,
		db: {} as never,
		logger: createLogger({
			level: "info",
			destination: { write: (line: string) => lines.push(JSON.parse(line)) },
		}),
		corsOrigin: "http://localhost:3001",
		trustProxy: false,
		release: { version: "test", commit: "test" },
		apiDocs: false,
		resendWebhookSecret,
	});
	return { app, lines };
};

const deliver = (
	app: ReturnType<typeof createApp>,
	event: object,
	signed = true,
) => {
	const body = JSON.stringify(event);
	const timestamp = String(Math.floor(Date.now() / 1000));
	const signature = createHmac("sha256", key)
		.update(`msg_1.${timestamp}.${body}`)
		.digest("base64");
	return app.request("/webhooks/resend", {
		method: "POST",
		headers: {
			"content-type": "application/json",
			"svix-id": "msg_1",
			"svix-timestamp": timestamp,
			"svix-signature": signed ? `v1,${signature}` : "v1,forged",
		},
		body,
	});
};

const bounced = {
	type: "email.bounced",
	created_at: "2026-10-15T10:00:00.000Z",
	data: {
		email_id: "re_msg_42",
		to: ["member@example.com"],
		subject: "Votre code de connexion",
		bounce: { type: "Permanent", message: "Mailbox does not exist" },
	},
};

describe("POST /webhooks/resend", () => {
	test("a signed bounce is acknowledged and logged by message id, never by address", async () => {
		const { app, lines } = appWith(secret);
		const response = await deliver(app, bounced);
		expect(response.status).toBe(204);
		const entry = lines.find((line) => line.emailId === "re_msg_42");
		expect(entry).toMatchObject({
			event: "email.bounced",
			bounceType: "Permanent",
		});
		expect(JSON.stringify(lines)).not.toContain("member@example.com");
	});

	test("a suppressed email is logged too", async () => {
		const { app, lines } = appWith(secret);
		const response = await deliver(app, {
			type: "email.suppressed",
			data: { email_id: "re_msg_43", to: ["member@example.com"] },
		});
		expect(response.status).toBe(204);
		expect(lines.find((line) => line.emailId === "re_msg_43")).toMatchObject({
			event: "email.suppressed",
		});
	});

	test("an unsigned or forged delivery is refused", async () => {
		const { app, lines } = appWith(secret);
		const response = await deliver(app, bounced, false);
		expect(response.status).toBe(401);
		expect(lines.find((line) => line.emailId === "re_msg_42")).toBeUndefined();
	});

	test("without a configured secret the endpoint does not exist", async () => {
		const { app } = appWith(undefined);
		expect((await deliver(app, bounced)).status).toBe(404);
	});
});
