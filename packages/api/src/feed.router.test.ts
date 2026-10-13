// The feed procedures through the router, without a database (#65): authorization and cursor
// refusals happen before any query, so the failing test database is never touched.
import { describe, expect, test } from "bun:test";
import type { Session } from "@codesphere/auth";
import { createRouterClient } from "@orpc/server";

import { appRouter } from "./routers";
import { testContext } from "./test-context";

const session = (kind: "human" | "agent") =>
	({
		user: { id: `u-${kind}`, role: "member", kind },
		session: { id: `s-${kind}` },
	}) as unknown as Session;

const clientAs = (s: Session | null) =>
	createRouterClient(appRouter, { context: testContext({ session: s }) });

describe("feed.forYou authorization", () => {
	test("a visitor is UNAUTHORIZED", async () => {
		await expect(
			clientAs(null).feed.forYou({ limit: 20 }),
		).rejects.toMatchObject({ code: "UNAUTHORIZED" });
	});

	test("an Agent is FORBIDDEN", async () => {
		await expect(
			clientAs(session("agent")).feed.forYou({ limit: 20 }),
		).rejects.toMatchObject({ code: "FORBIDDEN" });
	});

	test("a forged cursor is a BAD_REQUEST on the cursor", async () => {
		await expect(
			clientAs(session("human")).feed.forYou({
				limit: 20,
				cursor: "forged",
			}),
		).rejects.toMatchObject({
			code: "BAD_REQUEST",
			data: { issues: [{ path: ["cursor"] }] },
		});
	});
});

describe("questions.list", () => {
	test("a forged cursor is a BAD_REQUEST on the cursor, for every sort", async () => {
		for (const sort of ["hot", "recent", "unanswered"] as const) {
			await expect(
				clientAs(null).questions.list({ sort, limit: 20, cursor: "forged" }),
			).rejects.toMatchObject({
				code: "BAD_REQUEST",
				data: { issues: [{ path: ["cursor"] }] },
			});
		}
	});

	test("an unknown sort is refused by the contract", async () => {
		await expect(
			clientAs(null).questions.list({
				// biome-ignore lint/suspicious/noExplicitAny: deliberately off-contract
				sort: "controversial" as any,
				limit: 20,
			}),
		).rejects.toMatchObject({ code: "BAD_REQUEST" });
	});
});
