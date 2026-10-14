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
import { useState } from "react";

import AdminFrame from "@/components/admin-frame";
import {
	deleteBlock,
	type TagGroup,
	tagGroup,
	tagMutationErrorKey,
} from "@/lib/admin-tags";
import { orpc } from "@/utils/orpc";

const GROUPS: { key: TagGroup; label: string }[] = [
	{ key: "protected", label: "Protégés" },
	{ key: "used", label: "Utilisés" },
	{ key: "unused", label: "Inutilisés" },
];

const ERRORS = {
	conflict:
		"Ce nom est déjà pris (formes normalisées identiques), ou le Tag a changé entre-temps.",
	forbidden: "Action réservée au staff.",
	notFound: "Ce Tag n'existe plus.",
	generic: "Une erreur est survenue. Réessayez.",
} as const;

type Mode = "read" | "edit" | "create";

export default function AdminTagsPage() {
	const queryClient = useQueryClient();
	const tags = useQuery(orpc.admin.tags.list.queryOptions({ input: {} }));
	const items = tags.data?.items ?? [];
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [mode, setMode] = useState<Mode>("read");
	const [name, setName] = useState("");
	const [error, setError] = useState<keyof typeof ERRORS | null>(null);
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
		<AdminFrame
			title="Tags"
			description="Les Tags officiels : création, renommage, suppression."
		>
			{tags.isError && (
				<Alert variant="destructive">
					<AlertCircleIcon />
					<AlertTitle>Liste indisponible</AlertTitle>
					<AlertDescription>
						{ERRORS[tagMutationErrorKey(tags.error)]}{" "}
						<Button variant="link" size="sm" onClick={() => tags.refetch()}>
							Réessayer
						</Button>
					</AlertDescription>
				</Alert>
			)}
			<AdminMasterDetail
				list={
					<GroupedList
						label="Tags"
						searchLabel="Rechercher un Tag"
						searchPlaceholder="Rechercher"
						emptyText={tags.isPending ? "Chargement…" : "Aucun Tag."}
						groups={GROUPS}
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
								aria-label="Créer un Tag"
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
						<RecordSheet title="Nouveau Tag" editing>
							<RecordSection title="Général">
								<Field
									id="tag-new"
									label="Nom"
									description="Mis en minuscules, sans espaces autour."
									error={error ? ERRORS[error] : undefined}
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
								saveLabel="Créer"
							/>
						</RecordSheet>
					) : selected ? (
						<RecordSheet
							title={selected.name}
							badges={
								selected.ownerHackathon ? (
									<Badge variant="outline">Protégé</Badge>
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
							<RecordSection title="Général">
								{mode === "edit" ? (
									<Field
										id="tag-name"
										label="Nom"
										error={error ? ERRORS[error] : undefined}
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
											{ label: "Nom", value: selected.name },
											{
												label: "Questions",
												value: String(selected.questionCount),
											},
											{
												label: "Propriétaire",
												value: selected.ownerHackathon
													? `Hackathon ${selected.ownerHackathon}`
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
								<RecordSection title="Suppression">
									{error && (
										<Alert variant="destructive">
											<AlertCircleIcon />
											<AlertDescription>{ERRORS[error]}</AlertDescription>
										</Alert>
									)}
									{block && (
										<p className="text-muted-foreground text-sm">{block}</p>
									)}
									<ConfirmTwoStep
										label="Supprimer ce Tag"
										disabled={busy || block !== null}
										onConfirm={() => remove.mutate({ id: selected.id })}
									/>
								</RecordSection>
							)}
						</RecordSheet>
					) : (
						<p className="text-muted-foreground text-sm">
							Choisissez un Tag, ou créez-en un avec « + ».
						</p>
					)
				}
			/>
		</AdminFrame>
	);
}
