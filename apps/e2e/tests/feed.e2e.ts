import { expect, test } from "@playwright/test";

import { setFollowedTags } from "../support/follows";
import {
	fillQuestion,
	publishQuestion,
	SEED_EMAIL,
	signIn,
	uniqueTitle,
} from "../support/journeys";

// The For You feed keeps the Member's own Question even on a Tag they do not follow (#204).
// Awa follows « ussd » only, then asks on « api »: without the fix, the feed hides it.
test.describe("For You feed", () => {
	test.beforeEach(() => setFollowedTags(SEED_EMAIL, ["ussd"]));
	test.afterEach(() => setFollowedTags(SEED_EMAIL, []));

	test("shows the Member's new question outside their followed Tags", async ({
		page,
	}) => {
		await signIn(page);
		const title = uniqueTitle("fil");
		await fillQuestion(page, title);
		await publishQuestion(page, title);

		await page.goto("/");
		// Signed in, home opens on « Pour toi ».
		await expect(page.getByText("Pour toi").first()).toBeVisible();
		await expect(page.getByText(title).first()).toBeVisible();
	});
});
