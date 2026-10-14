"use client";

import type { AdminMember as AdminMemberSchema } from "@codesphere/contract";
import { Badge } from "@codesphere/ui/components/atoms/badge";
import { Button } from "@codesphere/ui/components/atoms/button";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@codesphere/ui/components/molecules/alert";
import { ConfirmTwoStep } from "@codesphere/ui/components/molecules/confirm-two-step";
import { GroupedList } from "@codesphere/ui/components/molecules/grouped-list";
import {
	isReasonValid,
	ReasonField,
} from "@codesphere/ui/components/molecules/reason-field";
import { AdminMasterDetail } from "@codesphere/ui/components/organisms/admin-master-detail";
import {
	RecordFields,
	RecordSection,
	RecordSheet,
} from "@codesphere/ui/components/organisms/record-sheet";
import {
	useInfiniteQuery,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { AlertCircleIcon } from "lucide-react";
import { useState } from "react";
import type { z } from "zod";

import AdminFrame from "@/components/admin-frame";
import { useAdminIdentity } from "@/components/admin-identity";
import {
	canModerate,
	type MemberGroup,
	memberGroup,
	moderationErrorKey,
} from "@/lib/admin-moderation";
import { orpc } from "@/utils/orpc";

type AdminMember = z.infer<typeof AdminMemberSchema>;

const GROUPS: { key: MemberGroup; label: string }[] = [
	{ key: "active", label: "Actifs" },
	{ key: "agents", label: "Agents" },
	{ key: "suspended", label: "Suspendus" },
];

const ERRORS = {
	forbidden:
		"Action refusée : vous ne pouvez modérer qu'un Member de rang inférieur.",
	conflict: "Ce Member a déjà changé d'état. La liste a été rechargée.",
	notFound: "Ce Member n'existe plus.",
	generic: "Une erreur est survenue. Réessayez.",
} as const;

const dateFormat = new Intl.DateTimeFormat("fr", {
	dateStyle: "medium",
	timeStyle: "short",
});

export default function ModerationPage() {
	const identity = useAdminIdentity();
	const queryClient = useQueryClient();
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [reason, setReason] = useState("");
	const [error, setError] = useState<keyof typeof ERRORS | null>(null);
	const [status, setStatus] = useState<"active" | "suspended" | undefined>();

	const members = useInfiniteQuery(
		orpc.admin.members.list.infiniteOptions({
			input: (cursor: string | undefined) => ({ limit: 50, cursor, status }),
			initialPageParam: undefined as string | undefined,
			getNextPageParam: (page) => page.nextCursor ?? undefined,
		}),
	);
	const items = members.data?.pages.flatMap((page) => page.items) ?? [];
	const selected = items.find((member) => member.id === selectedId) ?? null;

	// A suspension lands in the audit log: refresh it too, so it shows without a manual reload.
	const refresh = () => {
		void queryClient.invalidateQueries({ queryKey: orpc.admin.members.key() });
		void queryClient.invalidateQueries({
			queryKey: orpc.admin.auditLog.key(),
		});
	};
	const onDone = () => {
		setError(null);
		setReason("");
		refresh();
	};
	const onFailed = (failure: unknown) => {
		setError(moderationErrorKey(failure));
		refresh();
	};
	const suspend = useMutation(
		orpc.admin.members.suspend.mutationOptions({
			onSuccess: onDone,
			onError: onFailed,
		}),
	);
	const reactivate = useMutation(
		orpc.admin.members.reactivate.mutationOptions({
			onSuccess: onDone,
			onError: onFailed,
		}),
	);

	return (
		<AdminFrame
			title="Modération"
			description="Suspendre ou réactiver un Member. Chaque action est journalisée."
		>
			{members.isError && (
				<Alert variant="destructive">
					<AlertCircleIcon />
					<AlertTitle>Liste indisponible</AlertTitle>
					<AlertDescription>
						{ERRORS[moderationErrorKey(members.error)]}{" "}
						<Button variant="link" size="sm" onClick={() => members.refetch()}>
							Réessayer
						</Button>
					</AlertDescription>
				</Alert>
			)}
			<AdminMasterDetail
				list={
					<>
						<div className="mb-2 flex gap-1" role="group" aria-label="Statut">
							{(
								[
									[undefined, "Tous"],
									["active", "Actifs"],
									["suspended", "Suspendus"],
								] as const
							).map(([value, label]) => (
								<Button
									key={label}
									size="sm"
									variant={status === value ? "default" : "outline"}
									aria-pressed={status === value}
									onClick={() => setStatus(value)}
								>
									{label}
								</Button>
							))}
						</div>
						<GroupedList
							label="Members"
							searchLabel="Rechercher un Member"
							searchPlaceholder="Nom ou e-mail"
							emptyText={
								members.isPending ? "Chargement…" : "Aucun Member à afficher."
							}
							groups={GROUPS}
							selectedId={selectedId}
							onSelect={(member) => {
								setSelectedId(member.id);
								setReason("");
								setError(null);
							}}
							items={items.map((member) => ({
								id: member.id,
								name: member.name,
								group: memberGroup(member),
								keywords: member.email,
								meta: member.suspendedAt ? "Suspendu" : undefined,
							}))}
						/>
						{members.hasNextPage && (
							<Button
								variant="outline"
								size="sm"
								className="mt-2"
								disabled={members.isFetchingNextPage}
								onClick={() => members.fetchNextPage()}
							>
								{members.isFetchingNextPage ? "Chargement…" : "Voir plus"}
							</Button>
						)}
					</>
				}
				detail={
					selected ? (
						<MemberSheet
							member={selected}
							selfId={identity?.id}
							actorRole={identity?.role}
							reason={reason}
							onReasonChange={setReason}
							error={error ? ERRORS[error] : undefined}
							busy={suspend.isPending || reactivate.isPending}
							onSuspend={() => suspend.mutate({ id: selected.id, reason })}
							onReactivate={() => reactivate.mutate({ id: selected.id })}
						/>
					) : (
						<p className="text-muted-foreground text-sm">
							Choisissez un Member dans la liste.
						</p>
					)
				}
			/>
		</AdminFrame>
	);
}

function MemberSheet({
	member,
	selfId,
	actorRole,
	reason,
	onReasonChange,
	error,
	busy,
	onSuspend,
	onReactivate,
}: {
	member: AdminMember;
	selfId?: string;
	actorRole?: string;
	reason: string;
	onReasonChange: (reason: string) => void;
	error?: string;
	busy: boolean;
	onSuspend: () => void;
	onReactivate: () => void;
}) {
	const permission = canModerate(member, selfId, actorRole);
	const refusal = permission.ok
		? undefined
		: permission.reason === "self"
			? "Vous ne pouvez pas vous suspendre vous-même."
			: "Rang égal ou supérieur au vôtre : vous ne pouvez pas modérer ce Member.";
	return (
		<RecordSheet
			title={member.name}
			badges={
				<>
					<Badge variant="outline">
						{member.kind === "agent" ? "Agent" : "Humain"}
					</Badge>
					{member.suspendedAt && <Badge variant="destructive">Suspendu</Badge>}
				</>
			}
		>
			<RecordSection title="Compte">
				<RecordFields
					fields={[
						{ label: "E-mail", value: member.email },
						{ label: "Rôle", value: member.role },
						{
							label: "Inscrit le",
							value: dateFormat.format(new Date(member.createdAt)),
						},
						...(member.suspendedAt
							? [
									{
										label: "Suspendu le",
										value: dateFormat.format(new Date(member.suspendedAt)),
									},
									{
										label: "Raison",
										value: member.suspensionReason ?? "—",
									},
								]
							: []),
					]}
				/>
			</RecordSection>
			<RecordSection title="Modération">
				{error && (
					<Alert variant="destructive">
						<AlertCircleIcon />
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}
				{refusal && <p className="text-muted-foreground text-sm">{refusal}</p>}
				{member.suspendedAt ? (
					<Button
						variant="outline"
						className="self-start"
						disabled={busy || !permission.ok}
						onClick={onReactivate}
					>
						Réactiver
					</Button>
				) : (
					<>
						<ReasonField
							id="suspend-reason"
							value={reason}
							onValueChange={onReasonChange}
						/>
						<ConfirmTwoStep
							label="Suspendre ce Member"
							disabled={busy || !permission.ok || !isReasonValid(reason)}
							onConfirm={onSuspend}
						/>
					</>
				)}
			</RecordSection>
		</RecordSheet>
	);
}
