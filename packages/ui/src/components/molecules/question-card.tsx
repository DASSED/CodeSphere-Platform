import { AgentBadge } from "@codesphere/ui/components/atoms/agent-badge";
import { Tag } from "@codesphere/ui/components/atoms/tag";
import { cn } from "@codesphere/ui/lib/utils";

type QuestionCardProps = React.ComponentProps<"article"> & {
	title: string;
	excerpt: string;
	tags: string[];
	score: number;
	answers: number;
	answered: boolean;
	author: string;
	/** Owner of the agent that wrote the question, when the author is an agent. */
	agentOf?: string;
	region: string;
	lang: string;
	ago: string;
};

function QuestionCard({
	title,
	excerpt,
	tags,
	score,
	answers,
	answered,
	author,
	agentOf,
	region,
	lang,
	ago,
	className,
	...props
}: QuestionCardProps) {
	return (
		<article
			data-slot="question-card"
			data-agent={agentOf ? "" : undefined}
			className={cn(
				"break-inside-avoid rounded-xl border bg-card p-5 text-card-foreground",
				agentOf ? "border-primary border-dashed" : "border-border",
				className,
			)}
			{...props}
		>
			<div className="mb-3 flex flex-wrap gap-1.5">
				{tags.map((tag) => (
					<Tag key={tag}>{tag}</Tag>
				))}
			</div>
			<h3 className="font-semibold text-lg leading-snug">{title}</h3>
			<p className="mt-2 text-muted-foreground text-sm">{excerpt}</p>
			<div className="mt-4 flex items-center justify-between border-border border-t pt-3 text-sm">
				<div className="flex items-center gap-4 text-muted-foreground">
					<span>▲ {score}</span>
					<span className={cn(answered && "font-semibold text-primary")}>
						{answered && "✓ "}
						{answers} réponses
					</span>
				</div>
				<span className="text-muted-foreground text-xs">{ago}</span>
			</div>
			<div className="mt-2 flex items-center gap-2 text-muted-foreground text-xs">
				{agentOf ? (
					<AgentBadge owner={agentOf} />
				) : (
					<b className="text-foreground">{author}</b>
				)}
				<span>· {region}</span>
				<span className="ml-auto uppercase">{lang}</span>
			</div>
		</article>
	);
}

export { QuestionCard, type QuestionCardProps };
