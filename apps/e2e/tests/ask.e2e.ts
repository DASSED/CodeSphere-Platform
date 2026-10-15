import { test } from "@playwright/test";

import {
	fillQuestion,
	publishQuestion,
	signIn,
	uniqueTitle,
} from "../support/journeys";

// Journey 1 (#55): sign in, then ask a Question.
test("sign in, then ask a question", async ({ page }) => {
	await signIn(page);
	const title = uniqueTitle("question");
	await fillQuestion(page, title);
	await publishQuestion(page, title);
});
