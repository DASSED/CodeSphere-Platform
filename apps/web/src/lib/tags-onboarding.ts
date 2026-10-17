// Tags onboarding (spec §3, #44): a Member who follows no Tag is sent to choose some. The step is
// skippable; the choice to skip is stored on the account (`tagsOnboardingSkipped`), so it holds on
// every device.

/** `followedCount` / `skipped` are undefined while loading: decide nothing yet. */
export function shouldOnboard({
	followedCount,
	skipped,
}: {
	followedCount: number | undefined;
	skipped: boolean | undefined;
}) {
	return followedCount === 0 && skipped === false;
}

/** Tags to follow before « Pour toi » has enough to work with (the onboarding asks for as many). */
export const MIN_FOLLOWED_TAGS = 3;

/**
 * Progress of the « Getting started » checklist: account (always done), Tags, first Question.
 * Null while the account is loading, so no step flickers from open to done.
 */
export function gettingStarted({
	followedCount,
	hasAskedQuestion,
}: {
	followedCount: number | undefined;
	hasAskedQuestion: boolean | undefined;
}) {
	if (followedCount === undefined || hasAskedQuestion === undefined) {
		return null;
	}
	const tags = followedCount >= MIN_FOLLOWED_TAGS;
	const done = 1 + Number(tags) + Number(hasAskedQuestion);
	return { tags, question: hasAskedQuestion, done, complete: done === 3 };
}
