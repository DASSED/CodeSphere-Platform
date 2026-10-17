import { describe, expect, test } from "bun:test";
import { createElement } from "react";

import {
	createEmailClient,
	type EmailTransport,
	WELCOME_SUBJECT,
	Welcome,
} from "./index";

const sent: Array<{ to: string; html: string; text: string }> = [];
const transport: EmailTransport = {
	emails: {
		async send(payload) {
			sent.push(payload);
			return { data: { id: "email_1" }, error: null };
		},
	},
};
const template = createElement(Welcome, { name: "Ada" });

describe("createEmailClient", () => {
	test("is disabled without credentials", async () => {
		const client = createEmailClient({});
		expect(client.enabled).toBe(false);
		expect(
			await client.send({ to: "a@b.c", subject: WELCOME_SUBJECT, template }),
		).toEqual({ status: "disabled" });
	});

	test("renders HTML and plain text and sends", async () => {
		const client = createEmailClient(
			{ EMAIL_FROM: "CodeSphere Platform <no-reply@x.test>" },
			transport,
		);
		const result = await client.send({
			to: "ada@x.test",
			subject: WELCOME_SUBJECT,
			template,
		});
		expect(result).toEqual({ status: "sent", id: "email_1" });
		expect(sent[0]?.html).toContain("Welcome, Ada");
		expect(sent[0]?.text?.toLowerCase()).toContain("welcome, ada");
	});

	test("reports a transport error as failed", async () => {
		const failing: EmailTransport = {
			emails: {
				send: async () => ({ data: null, error: { message: "rate limited" } }),
			},
		};
		const client = createEmailClient({ EMAIL_FROM: "a@x.test" }, failing);
		expect(await client.send({ to: "a@b.c", subject: "s", template })).toEqual({
			status: "failed",
			message: "rate limited",
		});
	});
});
