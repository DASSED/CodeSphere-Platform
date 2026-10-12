/// <reference types="bun" />
import { describe, expect, test } from "bun:test";

import { truncateIp } from "./ip";

describe("truncateIp", () => {
	test("zeroes the last octet of an IPv4 address", () => {
		expect(truncateIp("203.0.113.42")).toBe("203.0.113.0");
	});

	test("keeps only the /48 prefix of an IPv6 address", () => {
		expect(truncateIp("2001:db8:85a3:8d3:1319:8a2e:370:7348")).toBe(
			"2001:db8:85a3::",
		);
	});

	test("expands a compressed IPv6 address before keeping its /48", () => {
		expect(truncateIp("2001::1:2:3")).toBe("2001:0:0::");
		expect(truncateIp("fe80::1%eth0")).toBe("fe80:0:0::");
	});

	test("handles an IPv4-mapped IPv6 address as IPv4", () => {
		expect(truncateIp("::ffff:198.51.100.7")).toBe("198.51.100.0");
	});

	test("returns undefined when the address is unknown", () => {
		expect(truncateIp(undefined)).toBeUndefined();
	});
});
