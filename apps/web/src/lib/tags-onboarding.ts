// Tags onboarding (spec §3, #44): a Member who follows no Tag is sent to choose some, once. The
// step is skippable; the choice to skip is remembered per Member on this device.

type Store = Pick<Storage, "getItem" | "setItem">;

const key = (userId: string) => `tags-onboarding-skipped:${userId}`;

export function isOnboardingSkipped(store: Store, userId: string) {
	return store.getItem(key(userId)) === "1";
}

export function markOnboardingSkipped(store: Store, userId: string) {
	store.setItem(key(userId), "1");
}

/** `followedCount` is undefined while the followed Tags are still loading: decide nothing yet. */
export function shouldOnboard({
	followedCount,
	skipped,
}: {
	followedCount: number | undefined;
	skipped: boolean;
}) {
	return followedCount === 0 && !skipped;
}
