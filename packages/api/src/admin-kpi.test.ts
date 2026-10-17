/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import type { Session } from "@codesphere/auth";
import { createRouterClient } from "@orpc/server";

import { metricsOf, windowsOf } from "./admin-kpi";
import { appRouter } from "./routers";
import { testContext } from "./test-context";

describe("admin KPI", () => {
	test("the 7-day window is cut into days, after the previous 7 days", () => {
		const now = new Date("2026-10-14T00:00:00.000Z");
		const { current, previous, buckets } = windowsOf("7d", now);
		expect(current.from.toISOString()).toBe("2026-10-07T00:00:00.000Z");
		expect(previous.from.toISOString()).toBe("2026-09-30T00:00:00.000Z");
		expect(previous.to).toEqual(current.from);
		expect(buckets).toHaveLength(7);
		expect(buckets[0]?.from).toEqual(current.from);
		expect(buckets[6]?.to).toEqual(now);
	});

	test("the 30-day window is cut into six 5-day buckets", () => {
		const { buckets } = windowsOf("30d", new Date("2026-10-14T00:00:00.000Z"));
		expect(buckets).toHaveLength(6);
		expect(buckets[1]?.from.toISOString()).toBe("2026-09-19T00:00:00.000Z");
	});

	test("rates have no value over nothing", () => {
		const metrics = metricsOf({
			activeMembers: 0,
			questions: 0,
			answered: 0,
			accepted: 0,
			medianFirstAnswerMinutes: null,
			posts: 0,
			agentPosts: 0,
		});
		expect(metrics.answerRate).toBeNull();
		expect(metrics.acceptedRate).toBeNull();
		expect(metrics.agentShare).toBeNull();
		expect(metrics.unanswered).toBe(0);
	});

	test("rates and unanswered derive from the counts", () => {
		const metrics = metricsOf({
			activeMembers: 3,
			questions: 4,
			answered: 3,
			accepted: 1,
			medianFirstAnswerMinutes: 90,
			posts: 10,
			agentPosts: 2,
		});
		expect(metrics.answerRate).toBe(0.75);
		expect(metrics.acceptedRate).toBe(0.25);
		expect(metrics.agentShare).toBe(0.2);
		expect(metrics.unanswered).toBe(1);
	});

	test("an anonymous call is UNAUTHORIZED, a Member's FORBIDDEN", async () => {
		const anonymous = createRouterClient(appRouter, { context: testContext() });
		await expect(anonymous.admin.kpi({ period: "7d" })).rejects.toMatchObject({
			code: "UNAUTHORIZED",
		});

		const member = createRouterClient(appRouter, {
			context: testContext({
				session: {
					user: { id: "m1", role: "member", kind: "human" },
					session: { id: "s1" },
				} as unknown as Session,
			}),
		});
		await expect(member.admin.kpi({ period: "7d" })).rejects.toMatchObject({
			code: "FORBIDDEN",
		});
	});
});
