"use client";

import { Button } from "@codesphere/ui/components/atoms/button";
import {
	Alert,
	AlertDescription,
} from "@codesphere/ui/components/molecules/alert";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@codesphere/ui/components/molecules/dialog";
import { CheckIcon, CopyIcon, TriangleAlertIcon } from "lucide-react";
import { useState } from "react";

type ApiKeyRevealProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	agentName: string;
	/** The secret, shown once: the server keeps only its hash. */
	apiKey: string;
};

/** Shows a freshly created agent key once. The dialog can only be closed after the key was copied. */
function ApiKeyReveal({
	open,
	onOpenChange,
	agentName,
	apiKey,
}: ApiKeyRevealProps) {
	const [copied, setCopied] = useState(false);

	const copy = async () => {
		try {
			await navigator.clipboard.writeText(apiKey);
			setCopied(true);
		} catch {
			setCopied(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!next && !copied) {
					return;
				}
				if (!next) {
					setCopied(false);
				}
				onOpenChange(next);
			}}
		>
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>Clé de l'agent {agentName}</DialogTitle>
					<DialogDescription>
						Copiez cette clé maintenant : elle ne sera plus jamais affichée.
					</DialogDescription>
				</DialogHeader>
				<Alert variant="warning">
					<TriangleAlertIcon />
					<AlertDescription>
						Traitez-la comme un mot de passe. Si vous la perdez, révoquez-la et
						créez-en une autre.
					</AlertDescription>
				</Alert>
				<code
					data-slot="api-key"
					className="block select-all break-all rounded-md border border-border bg-muted px-3 py-2 font-mono text-xs"
				>
					{apiKey}
				</code>
				<DialogFooter>
					<Button type="button" variant="outline" onClick={copy}>
						{copied ? <CheckIcon /> : <CopyIcon />}
						{copied ? "Clé copiée" : "Copier la clé"}
					</Button>
					<Button
						type="button"
						disabled={!copied}
						onClick={() => onOpenChange(false)}
					>
						J'ai copié la clé
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export { ApiKeyReveal, type ApiKeyRevealProps };
