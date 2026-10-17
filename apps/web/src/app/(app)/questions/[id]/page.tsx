import { QuestionPage } from "@/components/question/question-page";

// A Question and its Answers (#69). Rendered in the browser, from the persisted cache when offline.
export default async function Page({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	return <QuestionPage id={id} />;
}
