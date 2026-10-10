"use client";

import { Button } from "@codesphere/ui/components/atoms/button";
import { StatusBadge } from "@codesphere/ui/components/atoms/status-badge";
import { Textarea } from "@codesphere/ui/components/atoms/textarea";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@codesphere/ui/components/molecules/tabs";
import { cn } from "@codesphere/ui/lib/utils";

/** `idle`: nothing to report. The other states mirror the outbox of the offline-first model. */
type AnswerFormStatus = "idle" | "draft" | "pending" | "rejected";

type AnswerFormProps = Omit<React.ComponentProps<"form">, "onSubmit"> & {
	value: string;
	onValueChange: (value: string) => void;
	/** The Markdown rendered and sanitized by the server, for the « Aperçu » tab. */
	preview: React.ReactNode;
	onSubmit: () => void;
	status?: AnswerFormStatus;
	/** Why the answer was rejected; the text of the answer is kept. */
	rejectionReason?: string;
	submitting?: boolean;
	/** On small screens, dock the form at the bottom of the viewport. */
	docked?: boolean;
};

const STATUS_NOTICE: Record<
	Exclude<AnswerFormStatus, "idle">,
	{ badge: "draft" | "pending" | "rejected"; text: (reason?: string) => string }
> = {
	draft: {
		badge: "draft",
		text: () => "Brouillon enregistré sur cet appareil.",
	},
	pending: {
		badge: "pending",
		text: () =>
			"Vous êtes hors ligne : la réponse sera envoyée au retour du réseau.",
	},
	rejected: {
		badge: "rejected",
		text: (reason) =>
			`${reason ?? "La réponse a été refusée"}. Votre texte est conservé, vous pouvez le corriger.`,
	},
};

function AnswerForm({
	value,
	onValueChange,
	preview,
	onSubmit,
	status = "idle",
	rejectionReason,
	submitting = false,
	docked = false,
	className,
	...props
}: AnswerFormProps) {
	const notice = status === "idle" ? null : STATUS_NOTICE[status];
	const empty = value.trim().length === 0;

	return (
		<form
			data-slot="answer-form"
			data-status={status}
			onSubmit={(event) => {
				event.preventDefault();
				if (!empty && !submitting) {
					onSubmit();
				}
			}}
			className={cn(
				"flex flex-col gap-3 rounded-lg border border-border bg-card p-4",
				docked &&
					"fixed inset-x-0 bottom-0 z-20 rounded-b-none border-x-0 border-b-0 shadow-lg md:static md:rounded-lg md:border-x md:border-b md:shadow-none",
				className,
			)}
			{...props}
		>
			<Tabs defaultValue="write">
				<TabsList>
					<TabsTrigger value="write">Écrire</TabsTrigger>
					<TabsTrigger value="preview">Aperçu</TabsTrigger>
				</TabsList>
				<TabsContent value="write">
					<Textarea
						aria-label="Votre réponse en Markdown"
						placeholder="Écrivez votre réponse en Markdown…"
						className="min-h-32"
						value={value}
						onChange={(event) => onValueChange(event.target.value)}
					/>
				</TabsContent>
				<TabsContent value="preview">
					<div className="min-h-32 rounded-md border border-border p-3 text-sm leading-relaxed">
						{empty ? (
							<p className="text-muted-foreground">Rien à prévisualiser.</p>
						) : (
							preview
						)}
					</div>
				</TabsContent>
			</Tabs>

			{notice && (
				<p
					role="status"
					className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs"
				>
					<StatusBadge status={notice.badge} />
					{notice.text(rejectionReason)}
				</p>
			)}

			<div className="flex justify-end">
				<Button type="submit" disabled={empty || submitting}>
					{submitting ? "Envoi…" : "Publier la réponse"}
				</Button>
			</div>
		</form>
	);
}

export { AnswerForm, type AnswerFormProps, type AnswerFormStatus };
