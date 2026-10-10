import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@codesphere/ui/components/molecules/alert";
import { AuditLog } from "@codesphere/ui/components/organisms/audit-log";
import { InfoIcon } from "lucide-react";

import AdminFrame from "@/components/admin-frame";

import { auditEntries } from "../sample-data";

export default function AuditPage() {
	return (
		<AdminFrame
			title="Journal d'audit"
			description="Clés d'agent, suspensions et suppressions de compte."
		>
			<Alert variant="info">
				<InfoIcon />
				<AlertTitle>Données d'exemple</AlertTitle>
				<AlertDescription>
					Le journal n'est pas encore alimenté par l'API.
				</AlertDescription>
			</Alert>
			<AuditLog entries={auditEntries} />
		</AdminFrame>
	);
}
