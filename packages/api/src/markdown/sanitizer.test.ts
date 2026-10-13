/// <reference types="bun" />
import { describe, expect, test } from "bun:test";

import { sanitizeMarkdown } from "./sanitizer";

describe("sanitizeMarkdown", () => {
	test("renders Markdown to the allowed HTML", () => {
		const { html } = sanitizeMarkdown("# Titre\n\nUn **mot** et `code`.");
		expect(html).toContain("<h1>Titre</h1>");
		expect(html).toContain("<strong>mot</strong>");
		expect(html).toContain("<code>code</code>");
	});

	test("highlights a fenced block and keeps the highlight classes", () => {
		const { html } = sanitizeMarkdown("```ts\nconst a = 1;\n```");
		expect(html).toContain("<pre>");
		expect(html).toContain('class="hljs');
	});

	test("gives links nofollow and noopener", () => {
		const { html } = sanitizeMarkdown("[site](https://example.com)");
		expect(html).toContain('href="https://example.com"');
		expect(html).toContain('rel="nofollow noopener"');
	});

	test("neutralises a javascript: link", () => {
		const { html } = sanitizeMarkdown("[clic](javascript:alert(1))");
		expect(html).not.toContain('href="javascript');
		expect(html).not.toContain("<a ");
	});

	test("escapes raw HTML instead of rendering it", () => {
		const { html } = sanitizeMarkdown(
			'<script>alert(1)</script><img src=x onerror="alert(1)">',
		);
		expect(html).not.toContain("<script");
		expect(html).not.toContain("<img");
	});

	test("strips a disallowed tag and keeps its text", () => {
		const { html } = sanitizeMarkdown("| a | b |\n|---|---|\n| 1 | 2 |");
		expect(html).not.toContain("<table");
		expect(html).not.toContain("<td");
		expect(html).toContain("1");
		expect(html).toContain("2");
	});

	test("returns the plain text without markup", () => {
		const { plaintext } = sanitizeMarkdown("# Titre\n\nUn **mot**.");
		expect(plaintext).toContain("Titre");
		expect(plaintext).toContain("mot");
		expect(plaintext).not.toContain("<");
	});

	test("returns empty output for an empty body", () => {
		expect(sanitizeMarkdown("")).toEqual({ html: "", plaintext: "" });
	});

	test("refuses a body over 20,000 characters", () => {
		expect(() => sanitizeMarkdown("a".repeat(20_001))).toThrow(
			"Markdown body exceeds 20,000 characters",
		);
	});
});
