import { expect, test } from "@playwright/test";

import { fillQuestion, signIn, uniqueTitle } from "../support/journeys";

// Journey 3 (#55): offline, publishing queues the Question; back online, it is sent.
test("offline, the question is queued, then sent", async ({
	page,
	context,
}) => {
	await signIn(page);
	const title = uniqueTitle("hors ligne");
	await fillQuestion(page, title);

	await context.setOffline(true);
	await page.getByRole("button", { name: "Publier la question" }).click();
	await expect(
		page.getByRole("status").filter({ hasText: "la question est en attente" }),
	).toBeVisible();
	await expect(page).toHaveURL(/\/ask/);

	await context.setOffline(false);
	await expect(page).toHaveURL(/\/questions\/[0-9a-f-]{36}/);
	await expect(page.getByRole("heading", { name: title })).toBeVisible();
});
