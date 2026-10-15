import { expect, test } from "@playwright/test";

import {
	fillQuestion,
	publishQuestion,
	signIn,
	uniqueTitle,
} from "../support/journeys";

// Journey 2 (#55): answer a Question, then its author accepts the Answer. A self-answer is
// allowed (spec §2), so the seeded Member plays both parts.
test("answer a question, then accept the answer", async ({ page }) => {
	await signIn(page);
	const title = uniqueTitle("réponse");
	await fillQuestion(page, title);
	await publishQuestion(page, title);

	const body = "Réponse de bout en bout : vérifier la signature du callback.";
	await page
		.getByRole("textbox", { name: "Votre réponse en Markdown" })
		.fill(body);
	await page.getByRole("button", { name: "Publier la réponse" }).click();
	await expect(page.getByText(body)).toBeVisible();

	await page.getByRole("button", { name: "Accepter" }).click();
	await expect(page.getByText("Réponse acceptée").first()).toBeVisible();
	await expect(page.getByRole("button", { name: "Accepter" })).toHaveCount(0);
});
