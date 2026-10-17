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
	/** Stable ids for the Markdown field and the submit button, for tests and QA flows. */
	bodyId?: string;
	submitId?: string;
	/** Texts in the interface language; French by default. */
	labels?: Partial<AnswerFormLabels>;
};

type AnswerFormLabels = {
	write: string;
	preview: string;
	body: string;
	placeholder: string;
	nothingToPreview: string;
	draft: string;
	pending: string;
	/** Shown when the answer was refused, with the reason when there is one. */
	rejected: (reason?: string) => string;
	submit: string;
	submitting: string;
	/** Text of the status badge shown beside the notice. */
	badge: Record<Exclude<AnswerFormStatus, "idle">, string>;
};

const FRENCH: AnswerFormLabels = {
	write: "Écrire",
	preview: "Aperçu",
	body: "Votre réponse en Markdown",
	placeholder: "Écrivez votre réponse en Markdown…",
	nothingToPreview: "Rien à prévisualiser.",
	draft: "Brouillon enregistré sur cet appareil.",
	pending:
		"Vous êtes hors ligne : la réponse sera envoyée au retour du réseau.",
	rejected: (reason) =>
		`${reason ?? "La réponse a été refusée."} Votre texte est conservé, vous pouvez le corriger.`,
	submit: "Publier la réponse",
	submitting: "Envoi…",
	badge: {
		draft: "Brouillon",
		pending: "En attente d'envoi",
		rejected: "Rejetée",
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
	bodyId,
	submitId,
	labels,
	className,
	...props
}: AnswerFormProps) {
	const l = { ...FRENCH, ...labels };
	const notice =
		status === "idle"
			? null
			: {
					badge: status,
					text: status === "rejected" ? l.rejected(rejectionReason) : l[status],
				};
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
					<TabsTrigger value="write">{l.write}</TabsTrigger>
					<TabsTrigger value="preview">{l.preview}</TabsTrigger>
				</TabsList>
				<TabsContent value="write">
					<Textarea
						id={bodyId}
						aria-label={l.body}
						placeholder={l.placeholder}
						className="min-h-32"
						value={value}
						onChange={(event) => onValueChange(event.target.value)}
					/>
				</TabsContent>
				<TabsContent value="preview">
					<div className="min-h-32 rounded-md border border-border p-3 text-sm leading-relaxed">
						{empty ? (
							<p className="text-muted-foreground">{l.nothingToPreview}</p>
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
					<StatusBadge status={notice.badge}>
						{l.badge[notice.badge]}
					</StatusBadge>
					{notice.text}
				</p>
			)}

			<div className="flex justify-end">
				<Button id={submitId} type="submit" disabled={empty || submitting}>
					{submitting ? l.submitting : l.submit}
				</Button>
			</div>
		</form>
	);
}

export {
	AnswerForm,
	type AnswerFormLabels,
	type AnswerFormProps,
	type AnswerFormStatus,
};
