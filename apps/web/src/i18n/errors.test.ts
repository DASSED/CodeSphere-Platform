/// <reference types="bun" />
import { describe, expect, test } from "bun:test";

import messagesEn from "../../messages/en.json";
import messagesFr from "../../messages/fr.json";
import { ERROR_CODES, type ErrorCode, errorCodeOf, toErrorCode } from "./errors";

const codes: ErrorCode[] = [...ERROR_CODES];

describe("errorCodeOf", () => {
	test("reads the oRPC code of a thrown error", () => {
		expect(errorCodeOf({ code: "CONFLICT", message: "taken" })).toBe("CONFLICT");
	});

	test("falls back to the generic code when there is no code", () => {
		expect(errorCodeOf(new Error("network down"))).toBe("INTERNAL_SERVER_ERROR");
		expect(errorCodeOf(null)).toBe("INTERNAL_SERVER_ERROR");
		expect(errorCodeOf("boom")).toBe("INTERNAL_SERVER_ERROR");
	});
});

describe("toErrorCode", () => {
	test("keeps known codes", () => {
		expect(toErrorCode("FORBIDDEN")).toBe("FORBIDDEN");
	});

	test("falls back to the generic code for unknown or missing codes", () => {
		expect(toErrorCode("SOMETHING_NEW")).toBe("INTERNAL_SERVER_ERROR");
		expect(toErrorCode(undefined)).toBe("INTERNAL_SERVER_ERROR");
	});
});

describe("error message coverage", () => {
	test.each(codes)("%s has a French and an English message", (code) => {
		expect(messagesFr.errors[code]).toBeTruthy();
		expect(messagesEn.errors[code]).toBeTruthy();
	});
});
