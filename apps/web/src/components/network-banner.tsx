"use client";

import { Button } from "@codesphere/ui/components/atoms/button";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@codesphere/ui/components/molecules/alert";
import { OfflineBanner } from "@codesphere/ui/components/molecules/offline-banner";
import { TriangleAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { useOutbox } from "@/components/outbox-provider";
import type { OutboxEntry } from "@/lib/outbox";

/**
 * The network and outbox state, under the site's bar (#73 #74): offline or syncing with the count
 * of writes waiting, and the writes that were refused or abandoned, with why.
 */
export function NetworkBanner() {
	const t = useTranslations("outbox");
	const tErrors = useTranslations("errors");
	const { online, pendingCount, entries, dismiss } = useOutbox();
	const failed = entries.filter(
		(e) => e.state === "rejected" || e.state === "abandoned",
	);
	if (online && pendingCount === 0 && failed.length === 0) {
		return null;
	}
	const describe = (entry: OutboxEntry) =>
		entry.state === "abandoned"
			? t("abandoned", { action: t(`actions.${entry.action.kind}`) })
			: t("rejected", {
					action: t(`actions.${entry.action.kind}`),
					reason: tErrors(entry.reason ?? "BAD_REQUEST"),
				});
	return (
		<div className="mx-auto grid max-w-6xl gap-2 px-4 pt-3 md:px-6">
			<OfflineBanner online={online} pendingCount={pendingCount} />
			{failed.length > 0 && (
				<Alert variant="warning" role="status">
					<TriangleAlertIcon />
					<AlertTitle>{t("failedTitle")}</AlertTitle>
					<AlertDescription>
						<ul className="grid gap-1">
							{failed.map((entry) => (
								<li
									key={entry.id}
									className="flex flex-wrap items-center gap-2"
								>
									<span>{describe(entry)}</span>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => dismiss(entry.id)}
									>
										{t("dismiss")}
									</Button>
								</li>
							))}
						</ul>
					</AlertDescription>
				</Alert>
			)}
		</div>
	);
}
