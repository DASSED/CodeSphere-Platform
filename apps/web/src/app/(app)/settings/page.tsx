"use client";

import { Button } from "@codesphere/ui/components/atoms/button";
import { Input } from "@codesphere/ui/components/atoms/input";
import { Switch } from "@codesphere/ui/components/atoms/switch";
import { Field } from "@codesphere/ui/components/molecules/field";
import {
	SettingRow,
	SettingsSection,
} from "@codesphere/ui/components/molecules/setting-row";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { orpc } from "@/utils/orpc";

type Draft = {
	name: string;
	country: string;
	city: string;
	cityPublic: boolean;
	hideAgentContent: boolean;
};

// Settings first (spec §2, #64): public profile, preferences and privacy of the signed-in member.
function TagsSection() {
	const t = useTranslations("settings.tags");
	const queryClient = useQueryClient();
	const [q, setQ] = useState("");
	const followed = useQuery(orpc.tags.followed.queryOptions());
	const found = useQuery({
		...orpc.tags.search.queryOptions({
			input: { q: q.trim() || undefined, limit: 8 },
		}),
		enabled: q.trim().length > 0,
	});
	const refresh = () => {
		void queryClient.invalidateQueries({ queryKey: orpc.tags.key() });
		void queryClient.invalidateQueries({ queryKey: orpc.feed.key() });
	};
	const follow = useMutation(
		orpc.tags.follow.mutationOptions({
			onSuccess: refresh,
			onError: () => toast.error(t("failed")),
		}),
	);
	const unfollow = useMutation(
		orpc.tags.unfollow.mutationOptions({
			onSuccess: refresh,
			onError: () => toast.error(t("failed")),
		}),
	);
	const items = followed.data?.items ?? [];

	return (
		<SettingsSection title={t("title")} description={t("description")}>
			<div className="flex flex-col gap-3">
				<h3 className="font-medium text-sm">{t("followed")}</h3>
				{items.length === 0 ? (
					<p className="text-muted-foreground text-sm">{t("none")}</p>
				) : (
					<ul className="flex flex-wrap gap-2">
						{items.map((tag) => (
							<li key={tag.name}>
								<Button
									type="button"
									variant="outline"
									size="sm"
									aria-label={t("unfollow", { name: tag.name })}
									disabled={unfollow.isPending}
									onClick={() => unfollow.mutate({ tag: tag.name })}
								>
									# {tag.name} ×
								</Button>
							</li>
						))}
					</ul>
				)}
				<Field id="tag-search" label={t("search")}>
					<Input
						id="tag-search"
						type="search"
						placeholder={t("searchPlaceholder")}
						value={q}
						onChange={(event) => setQ(event.target.value)}
					/>
				</Field>
				{q.trim() && found.data && (
					<ul className="flex flex-wrap gap-2">
						{found.data.items.length === 0 && (
							<li className="text-muted-foreground text-sm">{t("noResult")}</li>
						)}
						{found.data.items.map((tag) => (
							<li key={tag.name}>
								<Button
									type="button"
									variant={tag.followed ? "secondary" : "default"}
									size="sm"
									aria-label={t("follow", { name: tag.name })}
									disabled={tag.followed || follow.isPending}
									onClick={() => follow.mutate({ tag: tag.name })}
								>
									# {tag.name}
								</Button>
							</li>
						))}
					</ul>
				)}
			</div>
		</SettingsSection>
	);
}

export default function SettingsPage() {
	const t = useTranslations("settings");
	const queryClient = useQueryClient();
	const me = useQuery(orpc.members.me.queryOptions());
	const [draft, setDraft] = useState<Draft>();

	useEffect(() => {
		if (me.data) {
			setDraft({
				name: me.data.name,
				country: me.data.country ?? "",
				city: me.data.city ?? "",
				cityPublic: me.data.cityPublic,
				hideAgentContent: me.data.hideAgentContent,
			});
		}
	}, [me.data]);

	const save = useMutation(
		orpc.members.update.mutationOptions({
			onSuccess: (profile) => {
				queryClient.setQueryData(orpc.members.me.queryKey(), profile);
				toast.success(t("saved"));
			},
			onError: () => toast.error(t("saveFailed")),
		}),
	);

	if (!draft) {
		return <p className="p-6 text-muted-foreground text-sm">{t("loading")}</p>;
	}

	const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
		setDraft({ ...draft, [key]: value });

	return (
		<form
			className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 sm:p-6"
			onSubmit={(event) => {
				event.preventDefault();
				save.mutate({
					name: draft.name,
					country: draft.country.trim()
						? draft.country.trim().toUpperCase()
						: null,
					city: draft.city.trim() || null,
					cityPublic: draft.cityPublic,
					hideAgentContent: draft.hideAgentContent,
				});
			}}
		>
			<h1 className="font-semibold text-2xl">{t("title")}</h1>

			<SettingsSection
				title={t("profile.title")}
				description={t("profile.description")}
			>
				<div className="flex flex-col gap-4 pb-1">
					<Field id="name" label={t("profile.name")} required>
						<Input
							id="name"
							value={draft.name}
							maxLength={80}
							required
							onChange={(event) => set("name", event.target.value)}
						/>
					</Field>
					<Field
						id="country"
						label={t("profile.country")}
						description={t("profile.countryHint")}
					>
						<Input
							id="country"
							value={draft.country}
							maxLength={5}
							autoComplete="country"
							onChange={(event) => set("country", event.target.value)}
						/>
					</Field>
					<Field
						id="city"
						label={t("profile.city")}
						description={t("profile.cityHint")}
					>
						<Input
							id="city"
							value={draft.city}
							maxLength={100}
							autoComplete="address-level2"
							onChange={(event) => set("city", event.target.value)}
						/>
					</Field>
				</div>
			</SettingsSection>

			<TagsSection />

			<SettingsSection title={t("preferences.title")}>
				<SettingRow
					title={t("preferences.hideAgentContent")}
					description={t("preferences.hideAgentContentHint")}
				>
					<Switch
						aria-label={t("preferences.hideAgentContent")}
						checked={draft.hideAgentContent}
						onCheckedChange={(checked) => set("hideAgentContent", checked)}
					/>
				</SettingRow>
			</SettingsSection>

			<SettingsSection title={t("privacy.title")}>
				<SettingRow
					title={t("privacy.cityPublic")}
					description={t("privacy.cityPublicHint")}
				>
					<Switch
						aria-label={t("privacy.cityPublic")}
						checked={draft.cityPublic}
						onCheckedChange={(checked) => set("cityPublic", checked)}
					/>
				</SettingRow>
			</SettingsSection>

			<div className="flex justify-end">
				<Button type="submit" disabled={save.isPending}>
					{save.isPending ? t("saving") : t("save")}
				</Button>
			</div>
		</form>
	);
}
