import { expect, type Page, test } from "@playwright/test";

import { signIn } from "../support/journeys";

// Votes on a Question (spec §2): a Member votes on someone else's content, never on their own.
// Seeded Questions (packages/db/src/seed/test-data.ts): #1 is Awa's, #3 her agent's.
const OWN_QUESTION = "/questions/00000000-0000-4000-8000-000000000001";
const OTHER_QUESTION = "/questions/00000000-0000-4000-8000-000000000003";

// The vote buttons keep their French labels in every locale for now (#208).
function voteControl(page: Page) {
	const group = page.getByRole("group", { name: "Voter sur la question" });
	return {
		up: group.getByRole("button", { name: "Voter pour" }),
		down: group.getByRole("button", { name: "Voter contre" }),
		score: group.locator("[aria-live]"),
	};
}

async function readScore(page: Page) {
	return Number(await voteControl(page).score.innerText());
}

/** Clicks a vote button and waits until the outbox has sent it to the API. */
async function voteAndSync(page: Page, button: "up" | "down") {
	const sent = page.waitForResponse(
		(r) => /\/votes\//.test(r.url()) && r.request().method() === "POST",
	);
	await voteControl(page)[button].click();
	expect((await sent).ok()).toBe(true);
}

test("vote up, switch to down, then retract on another member's question", async ({
	page,
}) => {
	await signIn(page);
	await page.goto(OTHER_QUESTION);
	const vote = voteControl(page);
	await expect(vote.up).toBeEnabled();

	// The database keeps the votes of every run: start from no vote, whatever an earlier run left.
	for (const button of ["up", "down"] as const) {
		if ((await vote[button].getAttribute("aria-pressed")) === "true") {
			await voteAndSync(page, button);
		}
	}
	const base = await readScore(page);

	await voteAndSync(page, "up");
	await expect(vote.up).toHaveAttribute("aria-pressed", "true");
	await expect(vote.score).toHaveText(String(base + 1));

	// Stored on the server, not only shown: still there after a reload.
	await page.reload();
	await expect(vote.up).toHaveAttribute("aria-pressed", "true");
	await expect(vote.score).toHaveText(String(base + 1));

	await voteAndSync(page, "down");
	await expect(vote.down).toHaveAttribute("aria-pressed", "true");
	await expect(vote.up).toHaveAttribute("aria-pressed", "false");
	await expect(vote.score).toHaveText(String(base - 1));

	// Pressing the same vote again retracts it.
	await voteAndSync(page, "down");
	await expect(vote.down).toHaveAttribute("aria-pressed", "false");
	await expect(vote.score).toHaveText(String(base));

	await page.reload();
	await expect(vote.up).toHaveAttribute("aria-pressed", "false");
	await expect(vote.down).toHaveAttribute("aria-pressed", "false");
	await expect(vote.score).toHaveText(String(base));
});

test("the author cannot vote on their own question", async ({ page }) => {
	await signIn(page);
	await page.goto(OWN_QUESTION);
	const vote = voteControl(page);
	await expect(vote.score).toBeVisible();
	await expect(vote.up).toBeDisabled();
	await expect(vote.down).toBeDisabled();
});
