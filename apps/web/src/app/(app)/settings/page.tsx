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
					country: draft.country.trim() ? draft.country.trim().toUpperCase() : null,
					city: draft.city.trim() || null,
					cityPublic: draft.cityPublic,
					hideAgentContent: draft.hideAgentContent,
				});
			}}
		>
			<h1 className="font-semibold text-2xl">{t("title")}</h1>

			<SettingsSection title={t("profile.title")} description={t("profile.description")}>
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
					<Field id="country" label={t("profile.country")} description={t("profile.countryHint")}>
						<Input
							id="country"
							value={draft.country}
							maxLength={5}
							autoComplete="country"
							onChange={(event) => set("country", event.target.value)}
						/>
					</Field>
					<Field id="city" label={t("profile.city")} description={t("profile.cityHint")}>
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
				<SettingRow title={t("privacy.cityPublic")} description={t("privacy.cityPublicHint")}>
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
