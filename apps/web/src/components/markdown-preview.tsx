"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { orpc } from "@/utils/orpc";

import { RenderedMarkdown } from "./rendered-markdown";

/**
 * The « Aperçu » of a form: the body rendered by the server's save pipeline (markdown.preview), so
 * what is shown is what will be published. Offline, the raw text is shown instead.
 */
export function MarkdownPreview({ body }: { body: string }) {
	const t = useTranslations("question.preview");
	const [debounced, setDebounced] = useState(body);
	useEffect(() => {
		const timer = setTimeout(() => setDebounced(body), 300);
		return () => clearTimeout(timer);
	}, [body]);
	const preview = useQuery({
		...orpc.markdown.preview.queryOptions({
			input: { body: debounced.slice(0, 20_000) },
		}),
		enabled: debounced.trim().length > 0,
		staleTime: Number.POSITIVE_INFINITY,
		// A failed preview is not worth a toast: the raw text stands in for it.
		meta: { silent: true },
	});
	if (preview.data) {
		return <RenderedMarkdown html={preview.data.html} />;
	}
	if (preview.isError || preview.isPaused) {
		return (
			<div className="grid gap-2">
				<p className="text-muted-foreground text-xs">{t("unavailable")}</p>
				<pre className="whitespace-pre-wrap font-sans text-sm">{body}</pre>
			</div>
		);
	}
	return <p className="text-muted-foreground text-sm">{t("loading")}</p>;
}
