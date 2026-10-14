"use client";

import { Button } from "@codesphere/ui/components/atoms/button";
import { Input } from "@codesphere/ui/components/atoms/input";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@codesphere/ui/components/molecules/alert";
import { Field } from "@codesphere/ui/components/molecules/field";
import { AuditLog } from "@codesphere/ui/components/organisms/audit-log";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { AlertCircleIcon } from "lucide-react";
import { useMemo, useState } from "react";

import AdminFrame from "@/components/admin-frame";
import { auditEntryOf, moderationErrorKey } from "@/lib/admin-moderation";
import { orpc } from "@/utils/orpc";

const dateFormat = new Intl.DateTimeFormat("fr", {
	dateStyle: "medium",
	timeStyle: "short",
});

type Filters = { action: string; actorId: string; targetType: string };
const NO_FILTERS: Filters = { action: "", actorId: "", targetType: "" };

export default function AuditPage() {
	const [filters, setFilters] = useState<Filters>(NO_FILTERS);
	const set = (key: keyof Filters) => (value: string) =>
		setFilters((current) => ({ ...current, [key]: value }));

	const log = useInfiniteQuery(
		orpc.admin.auditLog.list.infiniteOptions({
			input: (cursor: string | undefined) => ({
				limit: 50,
				cursor,
				action: filters.action.trim() || undefined,
				actorId: filters.actorId.trim() || undefined,
				targetType: filters.targetType.trim() || undefined,
			}),
			initialPageParam: undefined as string | undefined,
			getNextPageParam: (page) => page.nextCursor ?? undefined,
		}),
	);
	// Names for the ids of the journal: the Members list, when it is readable.
	const members = useQuery(
		orpc.admin.members.list.queryOptions({ input: { limit: 50 } }),
	);
	const names = useMemo(
		() =>
			new Map((members.data?.items ?? []).map((m) => [m.id, m.name] as const)),
		[members.data],
	);

	const entries = (log.data?.pages.flatMap((page) => page.items) ?? []).map(
		(event) =>
			auditEntryOf(
				event,
				(id) => names.get(id),
				(iso) => dateFormat.format(new Date(iso)),
			),
	);

	return (
		<AdminFrame
			title="Journal d'audit"
			description="Les actions du staff : suspensions, modifications, suppressions."
		>
			<form
				className="grid gap-3 sm:grid-cols-3"
				onSubmit={(event) => event.preventDefault()}
			>
				<Field id="audit-action" label="Action">
					<Input
						id="audit-action"
						placeholder="member.suspend"
						value={filters.action}
						onChange={(e) => set("action")(e.target.value)}
					/>
				</Field>
				<Field id="audit-actor" label="Acteur (identifiant)">
					<Input
						id="audit-actor"
						value={filters.actorId}
						onChange={(e) => set("actorId")(e.target.value)}
					/>
				</Field>
				<Field id="audit-target" label="Type de cible">
					<Input
						id="audit-target"
						placeholder="member"
						value={filters.targetType}
						onChange={(e) => set("targetType")(e.target.value)}
					/>
				</Field>
			</form>
			{log.isError ? (
				<Alert variant="destructive">
					<AlertCircleIcon />
					<AlertTitle>Journal indisponible</AlertTitle>
					<AlertDescription>
						{moderationErrorKey(log.error) === "forbidden"
							? "Accès réservé au staff."
							: "Une erreur est survenue."}{" "}
						<Button variant="link" size="sm" onClick={() => log.refetch()}>
							Réessayer
						</Button>
					</AlertDescription>
				</Alert>
			) : log.isPending ? (
				<p className="text-muted-foreground text-sm">Chargement…</p>
			) : entries.length === 0 ? (
				<p className="text-muted-foreground text-sm">
					Aucun événement pour ces filtres.
				</p>
			) : (
				<AuditLog entries={entries} />
			)}
			{log.hasNextPage && (
				<Button
					variant="outline"
					className="self-start"
					disabled={log.isFetchingNextPage}
					onClick={() => log.fetchNextPage()}
				>
					Voir plus
				</Button>
			)}
		</AdminFrame>
	);
}
