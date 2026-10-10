"use client";

import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@codesphere/ui/components/molecules/alert";
import {
	type AuditEntry,
	AuditLog,
} from "@codesphere/ui/components/organisms/audit-log";
import {
	type ModerationRow,
	ModerationTable,
} from "@codesphere/ui/components/organisms/moderation-table";
import { InfoIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import AdminFrame from "@/components/admin-frame";

import { auditEntries, moderationRows } from "./sample-data";

export default function AdminPage() {
	const [rows, setRows] = useState<ModerationRow[]>(moderationRows);
	const [entries, setEntries] = useState<AuditEntry[]>(
		auditEntries.slice(0, 3),
	);

	const confirm = (row: ModerationRow) => {
		const next = row.kind === "question" ? "closed" : "suspended";
		setRows((current) =>
			current.map((r) => (r.id === row.id ? { ...r, status: next } : r)),
		);
		setEntries((current) => [
			{
				id: `local-${row.id}`,
				at: "à l'instant",
				actor: "admin@codesphere",
				action: row.kind === "question" ? "Question fermée" : "Membre suspendu",
				target: row.title,
				tone: row.kind === "question" ? "warning" : "destructive",
			},
			...current,
		]);
	};

	return (
		<AdminFrame
			title="Modération"
			description="Fermer une Question, suspendre un Member. Chaque action est journalisée."
		>
			<Alert variant="info">
				<InfoIcon />
				<AlertTitle>Données d'exemple</AlertTitle>
				<AlertDescription>
					Aucune API n'est branchée à l'administration : les actions ci-dessous
					ne modifient que cet écran.
				</AlertDescription>
			</Alert>
			<section className="flex flex-col gap-3">
				<h2 className="font-semibold text-sm">File de modération</h2>
				<ModerationTable rows={rows} onConfirm={confirm} />
			</section>
			<section className="flex flex-col gap-3">
				<div className="flex items-center justify-between">
					<h2 className="font-semibold text-sm">Dernières actions</h2>
					<Link
						href="/admin/audit"
						className="text-primary text-xs hover:underline"
					>
						Voir tout le journal
					</Link>
				</div>
				<AuditLog entries={entries} />
			</section>
		</AdminFrame>
	);
}
