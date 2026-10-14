"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { shouldOnboard } from "@/lib/tags-onboarding";
import { orpc } from "@/utils/orpc";

/** Sends a Member who follows no Tag to the onboarding, unless they skipped it (#44). */
export default function TagsOnboardingRedirect() {
	const router = useRouter();
	const followed = useQuery(orpc.tags.followed.queryOptions());
	const me = useQuery(orpc.members.me.queryOptions());
	const count = followed.data?.items.length;
	const skipped = me.data?.tagsOnboardingSkipped;

	useEffect(() => {
		if (shouldOnboard({ followedCount: count, skipped })) {
			router.replace("/onboarding/tags");
		}
	}, [count, skipped, router]);

	return null;
}
