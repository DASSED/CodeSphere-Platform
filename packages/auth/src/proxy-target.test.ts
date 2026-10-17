/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { symmetricEncrypt } from "better-auth/crypto";

import {
	isAllowedProxyTarget,
	isRefusedProxyCallback,
	proxyTargetOf,
} from "./proxy-target";

const staging = "https://staging.codesphereplatform.xyz";
const secret = "s".repeat(32);

describe("isAllowedProxyTarget", () => {
	test.each([
		["https://staging.codesphereplatform.xyz/", true],
		["https://staging.codesphereplatform.xyz/fr/questions", true],
		["https://pr-153.preview.codesphereplatform.xyz/", true],
		["https://pr-153.preview.codesphereplatform.xyz/api/auth/callback", true],
		["https://evil.example/", false],
		["https://codesphereplatform.xyz/", false],
		["https://evil.preview.codesphereplatform.xyz.attacker.example/", false],
		["https://a.b.preview.codesphereplatform.xyz/", false],
		["https://.preview.codesphereplatform.xyz/", false],
		["http://pr-153.preview.codesphereplatform.xyz/", false],
		["not a url", false],
	])("%s -> %p", (target, allowed) => {
		expect(isAllowedProxyTarget(target, staging)).toBe(allowed);
	});
});

describe("proxyTargetOf", () => {
	// Builds the same two-layer state the plugin produces, so the decryption is exercised for real.
	const stateFor = async (callbackURL: string, key = secret) => {
		const stateCookie = await symmetricEncrypt({
			key,
			data: JSON.stringify({ callbackURL }),
		});
		return symmetricEncrypt({
			key,
			data: JSON.stringify({ isOAuthProxy: true, state: "abc", stateCookie }),
		});
	};

	test("reads the callback URL from a valid proxy state", async () => {
		const state = await stateFor(
			"https://pr-153.preview.codesphereplatform.xyz/",
		);
		expect(await proxyTargetOf(state, secret)).toBe(
			"https://pr-153.preview.codesphereplatform.xyz/",
		);
	});

	test("returns null for a state sealed with another secret", async () => {
		const state = await stateFor("https://evil.example/", "x".repeat(32));
		expect(await proxyTargetOf(state, secret)).toBeNull();
	});

	test("returns null for a value that is not a state", async () => {
		expect(await proxyTargetOf("garbage", secret)).toBeNull();
	});
});

describe("isRefusedProxyCallback", () => {
	const sealed = async (callbackURL: string, key = secret) => {
		const stateCookie = await symmetricEncrypt({
			key,
			data: JSON.stringify({ callbackURL }),
		});
		return symmetricEncrypt({
			key,
			data: JSON.stringify({ isOAuthProxy: true, state: "abc", stateCookie }),
		});
	};

	test("refuses a sealed state that sends the member outside staging and previews", async () => {
		const state = await sealed("https://evil.example/steal");
		expect(await isRefusedProxyCallback(state, secret, staging)).toBe(true);
	});

	test("refuses a look-alike preview domain", async () => {
		const state = await sealed(
			"https://pr-1.preview.codesphereplatform.xyz.evil.example/",
		);
		expect(await isRefusedProxyCallback(state, secret, staging)).toBe(true);
	});

	test("allows staging and one preview", async () => {
		expect(
			await isRefusedProxyCallback(
				await sealed(`${staging}/fr`),
				secret,
				staging,
			),
		).toBe(false);
		expect(
			await isRefusedProxyCallback(
				await sealed("https://pr-9.preview.codesphereplatform.xyz/"),
				secret,
				staging,
			),
		).toBe(false);
	});

	test("does not refuse what it cannot read: the plugin refuses it", async () => {
		const state = await sealed("https://evil.example/", "x".repeat(32));
		expect(await isRefusedProxyCallback(state, secret, staging)).toBe(false);
	});
});
