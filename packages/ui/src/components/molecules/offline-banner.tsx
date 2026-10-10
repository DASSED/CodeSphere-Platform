import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@codesphere/ui/components/molecules/alert";
import { CloudUploadIcon, WifiOffIcon } from "lucide-react";

type OfflineBannerProps = Omit<
	React.ComponentProps<typeof Alert>,
	"children" | "variant"
> & {
	online: boolean;
	/** Questions, answers and votes waiting in the outbox. */
	pendingCount?: number;
};

/** Network state of the offline-first model: offline, syncing, or nothing to show. */
function OfflineBanner({
	online,
	pendingCount = 0,
	...props
}: OfflineBannerProps) {
	if (online && pendingCount === 0) {
		return null;
	}
	const waiting = `${pendingCount} envoi${pendingCount > 1 ? "s" : ""} en attente`;
	return (
		<Alert
			variant={online ? "info" : "warning"}
			role="status"
			data-slot="offline-banner"
			data-online={online}
			{...props}
		>
			{online ? <CloudUploadIcon /> : <WifiOffIcon />}
			<AlertTitle>
				{online ? "Synchronisation en cours" : "Vous êtes hors ligne"}
			</AlertTitle>
			<AlertDescription>
				{online
					? `${waiting} : tout est envoyé dès que possible.`
					: pendingCount > 0
						? `${waiting}. Vous pouvez continuer à lire et à écrire, tout sera envoyé au retour du réseau.`
						: "Vous pouvez continuer à lire les contenus déjà visités et à préparer vos réponses."}
			</AlertDescription>
		</Alert>
	);
}

export { OfflineBanner, type OfflineBannerProps };
