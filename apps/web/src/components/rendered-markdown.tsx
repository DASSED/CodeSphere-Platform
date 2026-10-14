import { cn } from "@codesphere/ui/lib/utils";

/**
 * A Question or Answer body as the server stored it: rendered from Markdown without raw HTML and
 * sanitized at save time (spec §4, #67). This is the one place the web app injects HTML.
 */
export function RenderedMarkdown({
	html,
	className,
}: {
	html: string;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"prose-codesphere text-sm leading-relaxed [&_a]:text-primary [&_a]:underline [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:font-mono [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_ul]:list-disc [&_ul]:pl-5",
				className,
			)}
			// biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized on the server at save time (sanitize-html allow-list).
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	);
}
