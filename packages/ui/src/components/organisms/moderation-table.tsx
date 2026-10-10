"use client";

import { Badge } from "@codesphere/ui/components/atoms/badge";
import { Button } from "@codesphere/ui/components/atoms/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@codesphere/ui/components/molecules/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@codesphere/ui/components/molecules/table";
import { useState } from "react";

type ModerationRow = {
	id: string;
	kind: "question" | "member";
	title: string;
	author: string;
	reportedAgo: string;
	status: "open" | "closed" | "active" | "suspended";
};

type ModerationTableProps = {
	rows: readonly ModerationRow[];
	/** Called once the admin confirms; the caller records the action in the audit log. */
	onConfirm: (row: ModerationRow) => void;
};

const STATUS_BADGE: Record<
	ModerationRow["status"],
	{
		label: string;
		variant: "outline" | "secondary" | "success" | "destructive";
	}
> = {
	open: { label: "Ouverte", variant: "outline" },
	closed: { label: "Fermée", variant: "secondary" },
	active: { label: "Actif", variant: "success" },
	suspended: { label: "Suspendu", variant: "destructive" },
};

const ACTION: Record<ModerationRow["kind"], { label: string; verb: string }> = {
	question: { label: "Fermer", verb: "fermer cette question" },
	member: { label: "Suspendre", verb: "suspendre ce membre" },
};

function actionable(row: ModerationRow) {
	return row.status === "open" || row.status === "active";
}

/** Moderation queue: close a Question, suspend a Member, with a confirmation step. */
function ModerationTable({ rows, onConfirm }: ModerationTableProps) {
	const [target, setTarget] = useState<ModerationRow | null>(null);

	return (
		<>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Contenu</TableHead>
						<TableHead>Auteur</TableHead>
						<TableHead>Signalé</TableHead>
						<TableHead>Statut</TableHead>
						<TableHead className="text-right">Action</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{rows.map((row) => {
						const status = STATUS_BADGE[row.status];
						return (
							<TableRow key={row.id}>
								<TableCell className="max-w-xs">
									<div className="flex flex-col gap-1">
										<span className="truncate font-medium">{row.title}</span>
										<span className="text-muted-foreground text-xs">
											{row.kind === "question" ? "Question" : "Membre"}
										</span>
									</div>
								</TableCell>
								<TableCell>{row.author}</TableCell>
								<TableCell className="whitespace-nowrap text-muted-foreground">
									{row.reportedAgo}
								</TableCell>
								<TableCell>
									<Badge variant={status.variant}>{status.label}</Badge>
								</TableCell>
								<TableCell className="text-right">
									<Button
										type="button"
										size="sm"
										variant="outline"
										disabled={!actionable(row)}
										onClick={() => setTarget(row)}
									>
										{ACTION[row.kind].label}
									</Button>
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>

			<Dialog
				open={target !== null}
				onOpenChange={(open) => !open && setTarget(null)}
			>
				<DialogContent>
					{target && (
						<>
							<DialogHeader>
								<DialogTitle>Confirmer l'action</DialogTitle>
								<DialogDescription>
									Vous allez {ACTION[target.kind].verb} : « {target.title} ».
									L'action est enregistrée dans le journal d'audit.
								</DialogDescription>
							</DialogHeader>
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => setTarget(null)}
								>
									Annuler
								</Button>
								<Button
									type="button"
									variant="destructive"
									onClick={() => {
										onConfirm(target);
										setTarget(null);
									}}
								>
									{ACTION[target.kind].label}
								</Button>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}

export { type ModerationRow, ModerationTable, type ModerationTableProps };
