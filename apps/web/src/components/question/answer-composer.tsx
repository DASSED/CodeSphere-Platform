"use client";

import {
	AnswerForm,
	type AnswerFormStatus,
} from "@codesphere/ui/components/organisms/answer-form";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { MarkdownPreview } from "@/components/markdown-preview";
import { useOutbox, useOutboxEntry } from "@/components/outbox-provider";
import { useDraft } from "@/lib/use-draft";

type AnswerDraft = { body: string; idempotencyKey: string };

/**
 * « Écrire / Aperçu » for an Answer (#48), docked at the bottom on a phone. The text is a Draft
 * kept on the device; publishing goes through the outbox with the Draft's idempotencyKey, so an
 * Answer written offline, or sent twice, is published once (#74). A refusal keeps the text.
 */
export function AnswerComposer({
	questionId,
	onPublished,
}: {
	questionId: string;
	onPublished: () => void;
}) {
	const t = useTranslations("question.answer");
	const tErrors = useTranslations("errors");
	const { enqueue, dismiss, online } = useOutbox();
	const draft = useDraft<AnswerDraft>(`answer:${questionId}`, {
		body: "",
		idempotencyKey: crypto.randomUUID(),
	});
	const [entryId, setEntryId] = useState<string | null>(null);
	const entry = useOutboxEntry(entryId);

	useEffect(() => {
		if (entry?.state === "sent") {
			setEntryId(null);
			dismiss(entry.id);
			draft.discard();
			onPublished();
		}
	}, [entry, dismiss, draft, onPublished]);

	const status: AnswerFormStatus = !entry
		? draft.value.body.trim()
			? "draft"
			: "idle"
		: entry.state === "rejected"
			? "rejected"
			: entry.state === "pending" && !online
				? "pending"
				: "idle";

	return (
		<section aria-labelledby="answer-heading" className="grid gap-3">
			<h2 id="answer-heading" className="font-semibold text-lg">
				{t("title")}
			</h2>
			<AnswerForm
				docked
				value={draft.value.body}
				onValueChange={(body) => {
					if (entry?.state === "rejected") {
						dismiss(entry.id);
						setEntryId(null);
					}
					draft.setValue({ ...draft.value, body });
				}}
				preview={<MarkdownPreview body={draft.value.body} />}
				status={status}
				rejectionReason={entry?.reason ? tErrors(entry.reason) : undefined}
				submitting={entry?.state === "sending"}
				onSubmit={async () => {
					setEntryId(
						await enqueue({
							kind: "answer.create",
							input: {
								questionId,
								idempotencyKey: draft.value.idempotencyKey,
								body: draft.value.body,
							},
						}),
					);
				}}
			/>
			{/* Leaves room above the docked form on a phone, so the last Answer stays readable. */}
			<div aria-hidden className="h-56 md:hidden" />
		</section>
	);
}
