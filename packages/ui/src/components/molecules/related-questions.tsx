import { cn } from "@codesphere/ui/lib/utils";
import { CircleCheckIcon } from "lucide-react";

type RelatedQuestion = {
	id: string;
	title: string;
	answers: number;
	answered: boolean;
	href: string;
};

type RelatedQuestionsProps = Omit<React.ComponentProps<"aside">, "children"> & {
	questions: readonly RelatedQuestion[];
	/** Texts in the interface language; French by default. */
	labels?: Partial<RelatedQuestionsLabels>;
};

type RelatedQuestionsLabels = {
	region: string;
	title: string;
	answers: (count: number) => string;
};

const FRENCH: RelatedQuestionsLabels = {
	region: "Questions proches",
	title: "Une question proche existe peut-être déjà",
	answers: (count) => `${count} réponse${count > 1 ? "s" : ""}`,
};

/** Close questions shown while the member types a title, to avoid duplicates (#68). */
function RelatedQuestions({
	questions,
	labels,
	className,
	...props
}: RelatedQuestionsProps) {
	const l = { ...FRENCH, ...labels };
	if (questions.length === 0) {
		return null;
	}
	return (
		<aside
			data-slot="related-questions"
			aria-label={l.region}
			className={cn(
				"flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3",
				className,
			)}
			{...props}
		>
			<h3 className="font-semibold text-muted-foreground text-xs">{l.title}</h3>
			<ul className="flex flex-col gap-1">
				{questions.map((question) => (
					<li key={question.id}>
						<a
							href={question.href}
							className="flex items-start justify-between gap-3 rounded-md px-2 py-1.5 text-sm outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50"
						>
							<span className="min-w-0">{question.title}</span>
							<span
								className={cn(
									"flex shrink-0 items-center gap-1 text-xs",
									question.answered
										? "font-medium text-success"
										: "text-muted-foreground",
								)}
							>
								{question.answered && <CircleCheckIcon className="size-3.5" />}
								{l.answers(question.answers)}
							</span>
						</a>
					</li>
				))}
			</ul>
		</aside>
	);
}

export {
	type RelatedQuestion,
	RelatedQuestions,
	type RelatedQuestionsLabels,
	type RelatedQuestionsProps,
};
