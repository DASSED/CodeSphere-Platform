import { openapi } from "@orpc/openapi";
import * as z from "zod";

import { base, Markdown } from "./base";

// The « Aperçu » of the Question and Answer forms (#68): the same server pipeline as a save
// (Markdown without raw HTML, sanitized, highlighted), so the preview is what will be published.
export const markdownContract = {
	preview: base
		.errors({ UNAUTHORIZED: {} })
		.meta(
			openapi({
				method: "POST",
				path: "/markdown/preview",
				tags: ["markdown"],
				summary: "Preview Markdown",
				description:
					"Renders and sanitizes Markdown exactly as a saved Question or Answer would be. Requires a session or an API key.",
			}),
		)
		.input(z.object({ body: Markdown }))
		.output(z.object({ html: z.string() })),
};
