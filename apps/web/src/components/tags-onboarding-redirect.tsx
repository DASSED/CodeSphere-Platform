"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { isOnboardingSkipped, shouldOnboard } from "@/lib/tags-onboarding";
import { orpc } from "@/utils/orpc";

/** Sends a Member who follows no Tag to the onboarding, unless they skipped it (#44). */
export default function TagsOnboardingRedirect({ userId }: { userId: string }) {
	const router = useRouter();
	const followed = useQuery(orpc.tags.followed.queryOptions());
	const count = followed.data?.items.length;

	useEffect(() => {
		const skipped = isOnboardingSkipped(window.localStorage, userId);
		if (shouldOnboard({ followedCount: count, skipped })) {
			router.replace("/onboarding/tags");
		}
	}, [count, userId, router]);

	return null;
}
