import { describe, expect, test } from "bun:test";
import type { EmailTransport } from "@codesphere/email";

import { createMailHooks } from "./mail";

const env = {
	RESEND_API_KEY: "re_test",
	EMAIL_FROM: "CodeSphere <no-reply@x.test>",
};
const logger = { warn: () => {}, info: () => {} };

const transport = (error: string | null): EmailTransport => ({
	emails: {
		send: async () =>
			error
				? { data: null, error: { message: error } }
				: { data: { id: "msg_1" }, error: null },
	},
});

describe("sendSignInOtp", () => {
	test("a delivered code resolves", async () => {
		const hooks = createMailHooks(env, logger, false, transport(null));
		await expect(
			hooks.sendSignInOtp?.("a@x.test", "123456", null),
		).resolves.toBeUndefined();
	});

	test("a code the provider refused fails the request, so the form can say so", async () => {
		const hooks = createMailHooks(env, logger, false, transport("rejected"));
		await expect(
			hooks.sendSignInOtp?.("a@x.test", "123456", null),
		).rejects.toThrow();
	});
});
