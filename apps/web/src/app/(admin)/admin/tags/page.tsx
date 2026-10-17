"use client";

import { Badge } from "@codesphere/ui/components/atoms/badge";
import { Button } from "@codesphere/ui/components/atoms/button";
import { Input } from "@codesphere/ui/components/atoms/input";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@codesphere/ui/components/molecules/alert";
import { ConfirmTwoStep } from "@codesphere/ui/components/molecules/confirm-two-step";
import { Field } from "@codesphere/ui/components/molecules/field";
import { GroupedList } from "@codesphere/ui/components/molecules/grouped-list";
import { SaveBar } from "@codesphere/ui/components/molecules/save-bar";
import { AdminMasterDetail } from "@codesphere/ui/components/organisms/admin-master-detail";
import {
	RecordFields,
	RecordSection,
	RecordSheet,
} from "@codesphere/ui/components/organisms/record-sheet";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircleIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import AdminFrame from "@/components/admin-frame";
import {
	deleteBlock,
	type TagGroup,
	tagGroup,
	tagMutationErrorKey,
} from "@/lib/admin-tags";
import { orpc } from "@/utils/orpc";

const GROUPS: TagGroup[] = ["protected", "used", "unused"];

type ErrorKey = ReturnType<typeof tagMutationErrorKey>;

type Mode = "read" | "edit" | "create";

export default function AdminTagsPage() {
	const t = useTranslations("admin.tags");
	const tc = useTranslations("admin.common");
	const queryClient = useQueryClient();
	const tags = useQuery(orpc.admin.tags.list.queryOptions({ input: {} }));
	const items = tags.data?.items ?? [];
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [mode, setMode] = useState<Mode>("read");
	const [name, setName] = useState("");
	const [error, setError] = useState<ErrorKey | null>(null);
	const selected = items.find((tag) => tag.id === selectedId) ?? null;

	const settled = (nextId: string | null) => {
		setError(null);
		setMode("read");
		setSelectedId(nextId);
		void queryClient.invalidateQueries({ queryKey: orpc.admin.tags.key() });
		void queryClient.invalidateQueries({
			queryKey: orpc.admin.auditLog.key(),
		});
	};
	const failed = (failure: unknown) => {
		setError(tagMutationErrorKey(failure));
		void queryClient.invalidateQueries({ queryKey: orpc.admin.tags.key() });
	};

	const create = useMutation(
		orpc.admin.tags.create.mutationOptions({
			onSuccess: (tag) => settled(tag.id),
			onError: failed,
		}),
	);
	const rename = useMutation(
		orpc.admin.tags.rename.mutationOptions({
			onSuccess: (tag) => settled(tag.id),
			onError: failed,
		}),
	);
	const remove = useMutation(
		orpc.admin.tags.delete.mutationOptions({
			onSuccess: () => settled(null),
			onError: failed,
		}),
	);

	const block = selected ? deleteBlock(selected) : null;
	const busy = create.isPending || rename.isPending || remove.isPending;

	return (
		<AdminFrame title={t("title")} description={t("description")}>
			{tags.isError && (
				<Alert variant="destructive">
					<AlertCircleIcon />
					<AlertTitle>{t("unavailable")}</AlertTitle>
					<AlertDescription>
						{t(`errors.${tagMutationErrorKey(tags.error)}`)}{" "}
						<Button variant="link" size="sm" onClick={() => tags.refetch()}>
							{t("retry")}
						</Button>
					</AlertDescription>
				</Alert>
			)}
			<AdminMasterDetail
				list={
					<GroupedList
						label={t("list")}
						searchLabel={t("search")}
						searchPlaceholder={t("searchPlaceholder")}
						emptyText={tags.isPending ? t("loading") : t("empty")}
						groups={GROUPS.map((key) => ({ key, label: t(`groups.${key}`) }))}
						selectedId={mode === "create" ? null : selectedId}
						onSelect={(tag) => {
							setSelectedId(tag.id);
							setMode("read");
							setError(null);
						}}
						actions={
							<Button
								variant="outline"
								size="icon"
								aria-label={t("create")}
								onClick={() => {
									setMode("create");
									setName("");
									setError(null);
								}}
							>
								<PlusIcon />
							</Button>
						}
						items={items.map((tag) => ({
							id: tag.id,
							name: tag.name,
							group: tagGroup(tag),
							meta: tag.questionCount,
						}))}
					/>
				}
				detail={
					mode === "create" ? (
						<RecordSheet title={t("newTitle")} editing>
							<RecordSection title={t("general")}>
								<Field
									id="tag-new"
									label={t("name")}
									description={t("nameHint")}
									error={error ? t(`errors.${error}`) : undefined}
								>
									<Input
										id="tag-new"
										value={name}
										maxLength={40}
										onChange={(e) => setName(e.target.value)}
									/>
								</Field>
							</RecordSection>
							<SaveBar
								dirty={name.trim().length > 0}
								saving={busy}
								onSave={() => create.mutate({ name })}
								onDiscard={() => setMode("read")}
								saveLabel={tc("create")}
								discardLabel={tc("cancel")}
								dirtyText={tc("dirty")}
								cleanText={tc("clean")}
							/>
						</RecordSheet>
					) : selected ? (
						<RecordSheet
							title={selected.name}
							badges={
								selected.ownerHackathon ? (
									<Badge variant="outline">{t("protected")}</Badge>
								) : undefined
							}
							editing={mode === "edit"}
							onEdit={
								selected.ownerHackathon
									? undefined
									: () => {
											setMode("edit");
											setName(selected.name);
											setError(null);
										}
							}
						>
							<RecordSection title={t("general")}>
								{mode === "edit" ? (
									<Field
										id="tag-name"
										label={t("name")}
										error={error ? t(`errors.${error}`) : undefined}
									>
										<Input
											id="tag-name"
											value={name}
											maxLength={40}
											onChange={(e) => setName(e.target.value)}
										/>
									</Field>
								) : (
									<RecordFields
										fields={[
											{ label: t("name"), value: selected.name },
											{
												label: t("questions"),
												value: String(selected.questionCount),
											},
											{
												label: t("owner"),
												value: selected.ownerHackathon
													? t("ownerHackathon", {
															slug: selected.ownerHackathon,
														})
													: "—",
											},
										]}
									/>
								)}
							</RecordSection>
							{mode === "edit" ? (
								<SaveBar
									dirty={
										name.trim().length > 0 &&
										name.trim().toLowerCase() !== selected.name
									}
									saving={busy}
									onSave={() =>
										rename.mutate({
											id: selected.id,
											name,
											expectedVersion: selected.version,
										})
									}
									onDiscard={() => setMode("read")}
								/>
							) : (
								<RecordSection title={t("deletion")}>
									{error && (
										<Alert variant="destructive">
											<AlertCircleIcon />
											<AlertDescription>
												{t(`errors.${error}`)}
											</AlertDescription>
										</Alert>
									)}
									{block && (
										<p className="text-muted-foreground text-sm">
											{block.reason === "owned"
												? t("blocked.owned", { slug: block.slug })
												: t("blocked.used", { count: block.count })}
										</p>
									)}
									<ConfirmTwoStep
										label={t("delete")}
										confirmLabel={(seconds) => tc("confirm", { seconds })}
										cancelLabel={tc("cancel")}
										disabled={busy || block !== null}
										onConfirm={() => remove.mutate({ id: selected.id })}
									/>
								</RecordSection>
							)}
						</RecordSheet>
					) : (
						<p className="text-muted-foreground text-sm">{t("pick")}</p>
					)
				}
			/>
		</AdminFrame>
	);
}
