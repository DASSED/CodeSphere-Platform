import hljs from "highlight.js";
import DOMPurify from "isomorphic-dompurify";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt({
	html: false, // Disable raw HTML in Markdown
	linkify: true,
	typographer: true,
	highlight(code, lang) {
		if (lang && hljs.getLanguage(lang)) {
			try {
				return hljs.highlight(code, { language: lang, ignoreIllegals: true })
					.value;
			} catch {
				return "";
			}
		}
		return "";
	},
});

// Configure DOMPurify: strip unwanted tags, allow safe HTML from markdown-it
const purifyConfig = {
	ALLOWED_TAGS: [
		"h1",
		"h2",
		"h3",
		"h4",
		"h5",
		"h6",
		"p",
		"br",
		"strong",
		"em",
		"u",
		"s",
		"ul",
		"ol",
		"li",
		"blockquote",
		"code",
		"pre",
		"a",
		"span", // for highlight.js <span class="hljs-*">
	],
	ALLOWED_ATTR: ["href", "rel", "target", "class"],
	KEEP_CONTENT: true,
};

export function sanitizeMarkdown(mdText: string): {
	html: string;
	plaintext: string;
} {
	if (!mdText) {
		return { html: "", plaintext: "" };
	}

	if (mdText.length > 20000) {
		throw new Error("Markdown body exceeds 20,000 characters");
	}

	// Render Markdown to HTML
	const dirty = md.render(mdText);

	// Sanitize with DOMPurify
	const clean = String(DOMPurify.sanitize(dirty, purifyConfig));

	// Post-process: add nofollow + noopener to links
	const withLinks = clean.replace(
		/<a\s+href="([^"]+)"([^>]*)>/g,
		(match: string, href: string, rest: string) => {
			// Reject javascript: and data: URLs
			if (href.match(/^(javascript|data):/i)) {
				return `<a href="about:blank"${rest}>`;
			}
			// Add rel="nofollow noopener"
			const hasRel = rest.includes('rel="');
			if (hasRel) {
				return match.replace(/rel="([^"]*)"/, 'rel="$1 nofollow noopener"');
			}
			return `<a href="${href}" rel="nofollow noopener"${rest}>`;
		},
	);

	// Extract plaintext (strip all HTML for indexing/search)
	const plaintext = withLinks.replace(/<[^>]*>/g, " ").trim();

	return { html: withLinks, plaintext };
}
