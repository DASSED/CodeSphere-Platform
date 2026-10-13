// The GET operations of the OpenAPI document are callable as documented (#65): query values
// arrive as text, so numbers and arrays must be coerced before the input schema validates them.
import { describe, expect, test } from "bun:test";
import { createLogger } from "@codesphere/logger";

import { restHandler } from "./app";

const apiHandler = restHandler(false);

const call = async (url: string) => {
	const { response } = await apiHandler.handle(new Request(url), {
		prefix: "/api",
		context: {
			session: null,
			// Any query fails: a request that reaches the database is a 500.
			db: new Proxy({} as never, {
				get() {
					throw new Error("database unavailable (test)");
				},
			}),
			logger: createLogger({ level: "silent" }),
			requestId: "test",
			release: { version: "test", commit: "test" },
		},
	});
	return response;
};

const issuesOf = async (response: Response | undefined) =>
	((await response?.json()) as { data?: { issues?: { path: string[] }[] } })
		.data?.issues;

describe("REST query strings", () => {
	test("questions.list: a string limit and bracketed tags pass validation", async () => {
		// The forged cursor is refused by the handler itself: a 400 on `cursor` (not on `limit`)
		// proves validation accepted the query first.
		const response = await call(
			"http://localhost/api/questions?limit=5&sort=hot&cursor=forged&tags[0]=sql",
		);
		expect(response?.status).toBe(400);
		expect((await issuesOf(response))?.[0]?.path).toEqual(["cursor"]);
	});

	test("a limit above the contract maximum is still refused", async () => {
		const response = await call("http://localhost/api/questions?limit=500");
		expect(response?.status).toBe(400);
		expect((await issuesOf(response))?.[0]?.path).toEqual(["limit"]);
	});

	test("feed.forYou: a visitor is UNAUTHORIZED over REST", async () => {
		const response = await call("http://localhost/api/feed/for-you?limit=10");
		expect(response?.status).toBe(401);
	});
});
