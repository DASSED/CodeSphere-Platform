import { describe, expect, it, test } from "bun:test";
import { sanitizeMarkdown } from "../markdown/sanitizer";

// Integration tests for questions API
// Full integration requires running Postgres; these tests verify core logic

describe("Questions API Integration", () => {
	describe("Markdown sanitization", () => {
		it("should prevent XSS via HTML injection", () => {
			const result1 = sanitizeMarkdown('<script>alert("xss")</script>');
			expect(result1.html).not.toContain("<script");

			const result2 = sanitizeMarkdown(
				"<img src=x onerror=\"alert('xss')\" />",
			);
			// Raw HTML is escaped, not executed
			expect(result2.html).toContain("&lt;img");

			const result3 = sanitizeMarkdown("<svg onload=\"alert('xss')\"></svg>");
			expect(result3.html).toContain("&lt;svg");
		});

		it("should add nofollow+noopener to links", () => {
			const result = sanitizeMarkdown("[Visit example](https://example.com)");
			expect(result.html).toContain('rel="nofollow noopener"');
		});

		it("should reject oversize bodies (>20000 chars)", () => {
			const oversize = "a".repeat(20001);
			expect(() => sanitizeMarkdown(oversize)).toThrow("exceeds 20,000");
		});

		it("should extract plaintext for indexing", () => {
			const result = sanitizeMarkdown("# Title\n\n**Bold** text");
			expect(result.plaintext).toContain("Title");
			expect(result.plaintext).toContain("Bold");
			expect(result.plaintext).not.toContain("<");
		});

		it("should highlight code blocks", () => {
			const result = sanitizeMarkdown("```js\nconst x = 1;\n```");
			expect(result.html).toContain("<code");
		});
	});

	// Database integration tests would require TEST_DATABASE_URL
	// and would test:
	// - Idempotency: same IdempotencyKey → same Question
	// - Optimistic locking: stale version → CONFLICT
	// - Soft delete: deleted questions return NOT_FOUND
	// - Authorization: non-author cannot update/delete
	// - Tag validation: 1-5 tags required
});

describe("sanitizer output rules (#67)", () => {
	test("an external image is dropped, not rendered", () => {
		const { html } = sanitizeMarkdown("![x](https://evil.example/x.png)");
		expect(html).not.toContain("<img");
		expect(html).not.toContain("evil.example");
	});

	test('links carry rel="nofollow noopener"', () => {
		const { html } = sanitizeMarkdown("[a](https://example.com)");
		expect(html).toContain('rel="nofollow noopener"');
	});

	test("fenced code is highlighted", () => {
		const { html } = sanitizeMarkdown("```ts\nconst a = 1;\n```");
		expect(html).toContain('class="language-ts"');
		expect(html).toContain('<span class="hljs-keyword">const</span>');
	});
});
