"use client";

import { Button } from "@codesphere/ui/components/atoms/button";
import { ConfirmTwoStep } from "@codesphere/ui/components/molecules/confirm-two-step";
import { SegmentedControl } from "@codesphere/ui/components/molecules/segmented-control";
import { SettingRow } from "@codesphere/ui/components/molecules/setting-row";
import { useQueryClient } from "@tanstack/react-query";
import { DownloadIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { errorCodeOf } from "@/i18n/errors";
import { clearPersistedCache } from "@/lib/persist";
import { exportFileName } from "@/lib/privacy";
import { client } from "@/utils/orpc";

/**
 * Export and account deletion (#53). The export is the JSON the server builds at once (profile,
 * content, votes, Tags, agents without their keys, consent). Deletion anonymises by default
 * (« Deleted member »), or also removes the Member's content except Answers accepted on someone
 * else's Question; either way the device is emptied afterwards.
 */
export function PrivacyActions() {
	const t = useTranslations("settings.privacy");
	const tErrors = useTranslations("errors");
	const queryClient = useQueryClient();
	const router = useRouter();
	const [exporting, setExporting] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [mode, setMode] = useState<"anonymise" | "erase">("anonymise");
	const modeLabel = (m: "anonymise" | "erase") => t(`deleteModes.${m}`);

	const download = async () => {
		setExporting(true);
		try {
			const data = await client.members.export();
			const url = URL.createObjectURL(
				new Blob([JSON.stringify(data, null, 2)], {
					type: "application/json",
				}),
			);
			const link = document.createElement("a");
			link.href = url;
			link.download = exportFileName(new Date());
			link.click();
			URL.revokeObjectURL(url);
		} catch (error) {
			toast.error(tErrors(errorCodeOf(error)));
		} finally {
			setExporting(false);
		}
	};

	const deleteAccount = async () => {
		setDeleting(true);
		try {
			await client.members.delete({ deleteContent: mode === "erase" });
			// The sessions are gone on the server: only the device is left to empty.
			await clearPersistedCache(queryClient);
			toast.success(t("deleted"));
			router.push("/");
			router.refresh();
		} catch (error) {
			toast.error(tErrors(errorCodeOf(error)));
			setDeleting(false);
		}
	};

	return (
		<>
			<SettingRow title={t("export")} description={t("exportHint")}>
				<Button
					type="button"
					variant="outline"
					disabled={exporting}
					onClick={() => void download()}
				>
					<DownloadIcon />
					{exporting ? t("exporting") : t("exportAction")}
				</Button>
			</SettingRow>
			<div className="grid gap-3 py-3">
				<div>
					<h3 className="font-medium text-destructive text-sm">
						{t("deleteTitle")}
					</h3>
					<p className="text-muted-foreground text-sm">
						{t(`deleteHints.${mode}`)}
					</p>
				</div>
				<SegmentedControl
					options={(["anonymise", "erase"] as const).map(modeLabel)}
					value={modeLabel(mode)}
					onValueChange={(label) =>
						setMode(label === modeLabel("erase") ? "erase" : "anonymise")
					}
				/>
				<ConfirmTwoStep
					label={t("deleteAction")}
					disabled={deleting}
					onConfirm={() => void deleteAccount()}
				/>
			</div>
		</>
	);
}
