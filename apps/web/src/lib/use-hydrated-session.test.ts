/// <reference types="bun" />
import { describe, expect, mock, test } from "bun:test";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

// A session the store already holds, as when get-session settles before a boundary hydrates.
mock.module("./auth-client", () => ({
	authClient: {
		useSession: () => ({
			data: { user: { name: "Ada Lovelace" } },
			isPending: false,
		}),
	},
}));

const { useHydratedSession } = await import("./use-hydrated-session");

function Probe() {
	const { data, isPending } = useHydratedSession();
	return createElement(
		"span",
		null,
		isPending ? "pending" : (data?.user.name ?? "visitor"),
	);
}

describe("useHydratedSession", () => {
	test("renders pending before mount, even with a resolved session", () => {
		expect(renderToString(createElement(Probe))).toBe("<span>pending</span>");
	});
});
