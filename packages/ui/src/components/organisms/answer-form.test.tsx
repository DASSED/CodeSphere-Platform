/// <reference types="bun" />
// #208: the shared components speak the interface language when the app passes its texts, and
// keep their French defaults otherwise. A server render checks what is shown.
import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { AnswerCard } from "../molecules/answer-card";
import { RelatedQuestions } from "../molecules/related-questions";
import { VoteControl } from "../molecules/vote-control";
import { AnswerForm } from "./answer-form";

const noop = () => {};

describe("AnswerForm", () => {
	test("French by default", () => {
		const html = renderToStaticMarkup(
			<AnswerForm
				value=""
				onValueChange={noop}
				preview={null}
				onSubmit={noop}
			/>,
		);
		expect(html).toContain("Publier la réponse");
		expect(html).toContain('aria-label="Votre réponse en Markdown"');
	});

	test("shows the texts it is given, with stable ids", () => {
		const html = renderToStaticMarkup(
			<AnswerForm
				value="Hi"
				onValueChange={noop}
				preview={null}
				onSubmit={noop}
				status="draft"
				bodyId="answer-body"
				submitId="answer-submit"
				labels={{
					write: "Write",
					body: "Your answer in Markdown",
					submit: "Publish the answer",
					draft: "Draft saved on this device.",
					badge: { draft: "Draft", pending: "Waiting", rejected: "Refused" },
				}}
			/>,
		);
		expect(html).toContain(">Write<");
		expect(html).toContain('id="answer-body"');
		expect(html).toContain('aria-label="Your answer in Markdown"');
		expect(html).toContain('id="answer-submit"');
		expect(html).toContain("Publish the answer");
		expect(html).toContain(">Draft<");
		expect(html).toContain("Draft saved on this device.");
		expect(html).not.toMatch(/Publier|Brouillon|Écrire/);
	});

	test("a refusal reason is not followed by a second period", () => {
		const html = renderToStaticMarkup(
			<AnswerForm
				value="Hi"
				onValueChange={noop}
				preview={null}
				onSubmit={noop}
				status="rejected"
				rejectionReason="Item not found."
			/>,
		);
		expect(html).toContain("Item not found. Votre texte est conservé");
	});
});

describe("labels of the Question page components", () => {
	test("VoteControl", () => {
		const html = renderToStaticMarkup(
			<VoteControl
				score={0}
				value={null}
				onValueChange={noop}
				labels={{ up: "Upvote", down: "Downvote" }}
			/>,
		);
		expect(html).toContain('aria-label="Upvote"');
		expect(html).toContain('aria-label="Downvote"');
	});

	test("AnswerCard passes its vote labels down", () => {
		const html = renderToStaticMarkup(
			<AnswerCard
				author="Awa"
				ago="now"
				score={0}
				vote={null}
				onVoteChange={noop}
				onAccept={noop}
				labels={{ accept: "Accept", vote: { up: "Upvote" } }}
			>
				body
			</AnswerCard>,
		);
		expect(html).toContain("Accept<");
		expect(html).not.toContain("Accepter");
		expect(html).toContain('aria-label="Upvote"');
	});

	test("RelatedQuestions", () => {
		const html = renderToStaticMarkup(
			<RelatedQuestions
				questions={[
					{ id: "1", title: "Q", answers: 0, answered: false, href: "/q/1" },
				]}
				labels={{
					title: "A similar question may already exist",
					answers: (count) => `${count} answers`,
				}}
			/>,
		);
		expect(html).toContain("A similar question may already exist");
		expect(html).toContain("0 answers");
	});
});
