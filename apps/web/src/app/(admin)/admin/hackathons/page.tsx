"use client";

import { Button } from "@codesphere/ui/components/atoms/button";
import { Input } from "@codesphere/ui/components/atoms/input";
import { Textarea } from "@codesphere/ui/components/atoms/textarea";
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
import { AlertCircleIcon } from "lucide-react";
import { useState } from "react";

import AdminFrame from "@/components/admin-frame";
import {
	criteriaTotal,
	fromLocalInput,
	isDirty,
	toLocalInput,
} from "@/lib/admin-hackathon";
import { orpc } from "@/utils/orpc";

const SLUG = "cadev-2026";

type Draft = {
	name: string;
	organizer: string;
	summary: string;
	teamMin: number;
	teamMax: number;
	sourceNote: string;
	milestones: {
		key: string;
		label: string;
		startsAt: string;
		endsAt: string;
	}[];
	criteria: {
		label: string;
		weight: number;
		scoredBy: "jury" | "public" | "peers";
	}[];
};

const dateFormat = new Intl.DateTimeFormat("fr", {
	dateStyle: "medium",
	timeStyle: "short",
});

export default function AdminHackathonsPage() {
	const queryClient = useQueryClient();
	const query = useQuery(
		orpc.hackathons.get.queryOptions({ input: { slug: SLUG } }),
	);
	const hackathon = query.data;
	const [draft, setDraft] = useState<Draft | null>(null);
	const [confirming, setConfirming] = useState(false);
	const [conflictVersion, setConflictVersion] = useState<number | null>(null);
	const [failure, setFailure] = useState<string | null>(null);

	const original: Draft | null = hackathon
		? {
				name: hackathon.name,
				organizer: hackathon.organizer,
				summary: hackathon.summary,
				teamMin: hackathon.teamMin,
				teamMax: hackathon.teamMax,
				sourceNote: hackathon.sourceNote ?? "",
				milestones: hackathon.milestones.map((m) => ({
					key: m.key,
					label: m.label,
					startsAt: toLocalInput(m.startsAt),
					endsAt: toLocalInput(m.endsAt),
				})),
				criteria: hackathon.criteria.map((c) => ({
					label: c.label,
					weight: c.weight,
					scoredBy: c.scoredBy,
				})),
			}
		: null;

	const save = useMutation(
		orpc.admin.hackathons.update.mutationOptions({
			onSuccess: (updated) => {
				queryClient.setQueryData(
					orpc.hackathons.get.queryKey({ input: { slug: SLUG } }),
					updated,
				);
				void queryClient.invalidateQueries({
					queryKey: orpc.admin.auditLog.key(),
				});
				setDraft(null);
				setConfirming(false);
				setConflictVersion(null);
				setFailure(null);
			},
			onError: (error) => {
				setConfirming(false);
				const code =
					typeof error === "object" && error !== null && "code" in error
						? String(error.code)
						: "";
				if (code === "CONFLICT") {
					const data = (error as { data?: { version?: number } }).data;
					setConflictVersion(data?.version ?? null);
					setFailure(null);
				} else {
					setFailure(
						code === "FORBIDDEN"
							? "Action réservée au staff."
							: "L'enregistrement a échoué. Réessayez.",
					);
				}
			},
		}),
	);

	const reload = async () => {
		await query.refetch();
		setDraft(null);
		setConflictVersion(null);
	};

	const total = draft ? criteriaTotal(draft.criteria) : 100;
	const dirty = Boolean(draft && original && isDirty(original, draft));
	const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
		draft && setDraft({ ...draft, [key]: value });

	const submit = () => {
		if (!hackathon || !draft) {
			return;
		}
		save.mutate({
			slug: SLUG,
			expectedVersion: hackathon.version,
			name: draft.name,
			organizer: draft.organizer,
			summary: draft.summary,
			teamMin: draft.teamMin,
			teamMax: draft.teamMax,
			sourceNote: draft.sourceNote.trim() || null,
			milestones: draft.milestones.flatMap((m) => {
				const startsAt = fromLocalInput(m.startsAt);
				return startsAt
					? [
							{
								key: m.key,
								label: m.label,
								startsAt,
								endsAt: fromLocalInput(m.endsAt),
							},
						]
					: [];
			}),
			criteria: draft.criteria,
		});
	};

	return (
		<AdminFrame
			title="Hackathon"
			description="Le CADEV, ses Milestones et ses critères de jugement."
		>
			{query.isError && (
				<Alert variant="destructive">
					<AlertCircleIcon />
					<AlertTitle>Hackathon indisponible</AlertTitle>
					<AlertDescription>
						Impossible de charger le Hackathon.{" "}
						<Button variant="link" size="sm" onClick={() => query.refetch()}>
							Réessayer
						</Button>
					</AlertDescription>
				</Alert>
			)}
			<AdminMasterDetail
				list={
					<GroupedList
						label="Hackathons"
						groups={[{ key: "hackathon", label: "Hackathon" }]}
						selectedId={hackathon ? SLUG : null}
						onSelect={() => undefined}
						emptyText={query.isPending ? "Chargement…" : "Aucun Hackathon."}
						items={
							hackathon
								? [{ id: SLUG, name: hackathon.name, group: "hackathon" }]
								: []
						}
					/>
				}
				detail={
					hackathon && original ? (
						<RecordSheet
							title={hackathon.name}
							editing={Boolean(draft)}
							onEdit={() => setDraft(original)}
						>
							{conflictVersion !== null && (
								<Alert variant="destructive">
									<AlertCircleIcon />
									<AlertTitle>Version périmée</AlertTitle>
									<AlertDescription>
										Quelqu'un a enregistré entre-temps (version serveur :{" "}
										{conflictVersion}). Rien n'a été écrasé.{" "}
										<Button variant="link" size="sm" onClick={reload}>
											Recharger
										</Button>
									</AlertDescription>
								</Alert>
							)}
							{failure && (
								<Alert variant="destructive">
									<AlertCircleIcon />
									<AlertDescription>{failure}</AlertDescription>
								</Alert>
							)}
							{draft ? (
								<>
									<RecordSection title="Général">
										<Field id="h-name" label="Nom">
											<Input
												id="h-name"
												value={draft.name}
												onChange={(e) => set("name", e.target.value)}
											/>
										</Field>
										<Field id="h-organizer" label="Organisateur">
											<Input
												id="h-organizer"
												value={draft.organizer}
												onChange={(e) => set("organizer", e.target.value)}
											/>
										</Field>
										<div className="grid grid-cols-2 gap-3">
											<Field id="h-min" label="Équipe min.">
												<Input
													id="h-min"
													type="number"
													min={1}
													value={draft.teamMin}
													onChange={(e) =>
														set("teamMin", Number(e.target.value))
													}
												/>
											</Field>
											<Field id="h-max" label="Équipe max.">
												<Input
													id="h-max"
													type="number"
													min={1}
													value={draft.teamMax}
													onChange={(e) =>
														set("teamMax", Number(e.target.value))
													}
												/>
											</Field>
										</div>
										<Field id="h-summary" label="Résumé">
											<Textarea
												id="h-summary"
												value={draft.summary}
												onChange={(e) => set("summary", e.target.value)}
											/>
										</Field>
										<Field
											id="h-source"
											label="Note de source"
											description="D'où vient l'information, affichée à côté de « vérifié le »."
										>
											<Textarea
												id="h-source"
												maxLength={500}
												value={draft.sourceNote}
												onChange={(e) => set("sourceNote", e.target.value)}
											/>
										</Field>
									</RecordSection>
									<RecordSection title="Milestones">
										{draft.milestones.map((m, index) => (
											<div
												key={m.key}
												className="grid gap-3 sm:grid-cols-[1fr_auto_auto]"
											>
												<Field id={`m-${m.key}-label`} label="Libellé">
													<Input
														id={`m-${m.key}-label`}
														value={m.label}
														onChange={(e) =>
															set(
																"milestones",
																draft.milestones.map((x, i) =>
																	i === index
																		? { ...x, label: e.target.value }
																		: x,
																),
															)
														}
													/>
												</Field>
												<Field id={`m-${m.key}-start`} label="Début">
													<Input
														id={`m-${m.key}-start`}
														type="datetime-local"
														value={m.startsAt}
														onChange={(e) =>
															set(
																"milestones",
																draft.milestones.map((x, i) =>
																	i === index
																		? { ...x, startsAt: e.target.value }
																		: x,
																),
															)
														}
													/>
												</Field>
												<Field id={`m-${m.key}-end`} label="Fin">
													<Input
														id={`m-${m.key}-end`}
														type="datetime-local"
														value={m.endsAt}
														onChange={(e) =>
															set(
																"milestones",
																draft.milestones.map((x, i) =>
																	i === index
																		? { ...x, endsAt: e.target.value }
																		: x,
																),
															)
														}
													/>
												</Field>
											</div>
										))}
										<p className="text-muted-foreground text-xs">
											Dates affichées dans votre fuseau horaire.
										</p>
									</RecordSection>
									<RecordSection title="Critères de jugement">
										{draft.criteria.map((c, index) => (
											<div
												key={c.label}
												className="grid grid-cols-[1fr_6rem] gap-3"
											>
												<Field id={`c-${index}-label`} label="Libellé">
													<Input
														id={`c-${index}-label`}
														value={c.label}
														onChange={(e) =>
															set(
																"criteria",
																draft.criteria.map((x, i) =>
																	i === index
																		? { ...x, label: e.target.value }
																		: x,
																),
															)
														}
													/>
												</Field>
												<Field id={`c-${index}-weight`} label="Poids (%)">
													<Input
														id={`c-${index}-weight`}
														type="number"
														min={0}
														max={100}
														value={c.weight}
														onChange={(e) =>
															set(
																"criteria",
																draft.criteria.map((x, i) =>
																	i === index
																		? { ...x, weight: Number(e.target.value) }
																		: x,
																),
															)
														}
													/>
												</Field>
											</div>
										))}
										<p
											aria-live="polite"
											className={
												total === 100
													? "text-muted-foreground text-sm"
													: "font-medium text-destructive text-sm"
											}
										>
											Total : {total} %{" "}
											{total === 100 ? "" : "(doit faire 100 %)"}
										</p>
									</RecordSection>
									{confirming && (
										<RecordSection title="Confirmation">
											<p className="text-sm">
												Enregistrer ces modifications ? Elles changent la page
												publique du Hackathon et sont journalisées.
											</p>
											<div className="flex flex-wrap gap-2">
												<ConfirmTwoStep
													label="Enregistrer"
													disabled={save.isPending}
													onConfirm={submit}
												/>
												<Button
													variant="outline"
													onClick={() => setConfirming(false)}
												>
													Annuler
												</Button>
											</div>
										</RecordSection>
									)}
									<SaveBar
										dirty={dirty && total === 100}
										saving={save.isPending}
										onSave={() => setConfirming(true)}
										onDiscard={() => {
											setDraft(null);
											setConfirming(false);
										}}
									/>
									<p className="text-muted-foreground text-xs">
										Le Hackathon ne se supprime pas.
									</p>
								</>
							) : (
								<>
									<RecordSection title="Général">
										<RecordFields
											fields={[
												{ label: "Organisateur", value: hackathon.organizer },
												{
													label: "Équipe",
													value: `${hackathon.teamMin} à ${hackathon.teamMax}`,
												},
												{ label: "Résumé", value: hackathon.summary },
												{
													label: "Note de source",
													value: hackathon.sourceNote ?? "—",
												},
												{ label: "Version", value: hackathon.version },
											]}
										/>
									</RecordSection>
									<RecordSection title="Milestones">
										<RecordFields
											fields={hackathon.milestones.map((m) => ({
												label: m.label,
												value: dateFormat.format(new Date(m.startsAt)),
											}))}
										/>
									</RecordSection>
									<RecordSection title="Critères de jugement">
										<RecordFields
											fields={hackathon.criteria.map((c) => ({
												label: c.label,
												value: `${c.weight} %`,
											}))}
										/>
									</RecordSection>
								</>
							)}
						</RecordSheet>
					) : (
						<p className="text-muted-foreground text-sm">
							{query.isPending ? "Chargement…" : "Aucun Hackathon."}
						</p>
					)
				}
			/>
		</AdminFrame>
	);
}
