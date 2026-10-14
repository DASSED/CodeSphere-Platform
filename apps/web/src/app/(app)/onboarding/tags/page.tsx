"use client";

import { TagPicker } from "@codesphere/ui/components/organisms/tag-picker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { markOnboardingSkipped } from "@/lib/tags-onboarding";
import { client, orpc } from "@/utils/orpc";

// Onboarding (spec §3, #44): choose at least 3 Tags to follow, or skip the step.
export default function TagsOnboardingPage() {
	const t = useTranslations("onboarding");
	const router = useRouter();
	const queryClient = useQueryClient();
	const { data: session } = authClient.useSession();
	const [value, setValue] = useState<string[]>([]);

	const popular = useQuery(
		orpc.tags.search.queryOptions({ input: { limit: 30 } }),
	);
	const followed = useQuery(orpc.tags.followed.queryOptions());

	// Start from what the Member already follows, so coming back never loses a choice.
	useEffect(() => {
		if (followed.data) {
			setValue(followed.data.items.map((tag) => tag.name));
		}
	}, [followed.data]);

	const save = useMutation({
		mutationFn: async (names: string[]) => {
			const already = new Set(followed.data?.items.map((tag) => tag.name));
			const wanted = new Set(names);
			// Both directions: a Tag deselected here is unfollowed, not left behind.
			await Promise.all([
				...names
					.filter((name) => !already.has(name))
					.map((tag) => client.tags.follow({ tag })),
				...[...already]
					.filter((name) => !wanted.has(name))
					.map((tag) => client.tags.unfollow({ tag })),
			]);
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: orpc.tags.key() });
			await queryClient.invalidateQueries({ queryKey: orpc.feed.key() });
			router.push("/");
		},
		onError: () => toast.error(t("failed")),
	});

	if (popular.isPending) {
		return <p className="p-6 text-muted-foreground text-sm">{t("loading")}</p>;
	}

	const names = [
		...new Set([
			...(popular.data?.items.map((tag) => tag.name) ?? []),
			...value,
		]),
	];

	return (
		<div className="mx-auto w-full max-w-2xl p-4 sm:p-6">
			<TagPicker
				tags={names}
				value={value}
				onValueChange={setValue}
				onSubmit={() => save.mutate(value)}
				onSkip={() => {
					// Passable (spec §3): remember it, so the Member is not sent back here.
					if (session) {
						markOnboardingSkipped(window.localStorage, session.user.id);
					}
					router.push("/");
				}}
			/>
		</div>
	);
}
