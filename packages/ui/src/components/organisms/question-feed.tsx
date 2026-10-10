import {
	QuestionCard,
	type QuestionCardProps,
} from "@codesphere/ui/components/molecules/question-card";
import { cn } from "@codesphere/ui/lib/utils";

type QuestionFeedProps = React.ComponentProps<"div"> & {
	questions: (QuestionCardProps & { id: string })[];
};

/** Two-column card feed: one column on small screens, masonry-style on `md` and up. */
function QuestionFeed({ questions, className, ...props }: QuestionFeedProps) {
	return (
		<div
			data-slot="question-feed"
			className={cn("columns-1 gap-5 md:columns-2", className)}
			{...props}
		>
			{questions.map(({ id, ...question }) => (
				<QuestionCard key={id} className="mb-5" {...question} />
			))}
		</div>
	);
}

export { QuestionFeed, type QuestionFeedProps };
