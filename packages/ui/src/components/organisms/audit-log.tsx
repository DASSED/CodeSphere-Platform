import { Badge } from "@codesphere/ui/components/atoms/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@codesphere/ui/components/molecules/table";

type AuditEntry = {
	id: string;
	/** Already formatted, e.g. « 10 oct. 14:32 ». */
	at: string;
	actor: string;
	action: string;
	target: string;
	tone?: "default" | "warning" | "destructive";
	/** The reason typed by the admin for a decision; shown under the target. */
	reason?: string;
};

type AuditLogProps = { entries: readonly AuditEntry[] };

/** Read-only audit journal: keys, suspensions and account deletions (spec §4, Logs). */
function AuditLog({ entries }: AuditLogProps) {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Date</TableHead>
					<TableHead>Acteur</TableHead>
					<TableHead>Action</TableHead>
					<TableHead>Cible</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{entries.map((entry) => (
					<TableRow key={entry.id}>
						<TableCell className="whitespace-nowrap font-mono text-muted-foreground text-xs">
							{entry.at}
						</TableCell>
						<TableCell>{entry.actor}</TableCell>
						<TableCell>
							<Badge
								variant={
									entry.tone === "destructive"
										? "destructive"
										: entry.tone === "warning"
											? "warning"
											: "outline"
								}
							>
								{entry.action}
							</Badge>
						</TableCell>
						<TableCell className="text-muted-foreground">
							{entry.target}
							{entry.reason && (
								<span className="mt-0.5 block text-xs">
									Raison : {entry.reason}
								</span>
							)}
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

export { type AuditEntry, AuditLog, type AuditLogProps };
