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
