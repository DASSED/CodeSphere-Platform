// Small rules of the home page (#130), kept out of the components so they are tested alone.

/** The instant submissions close: the `submission_close` Milestone, else the first one. */
export function submissionClose(
	milestones: readonly { key: string; startsAt: string }[],
): string | null {
	const close = milestones.find((m) => m.key === "submission_close");
	return (close ?? milestones[0])?.startsAt ?? null;
}

/** « Bonjour » until 18:00 in the viewer's time, « Bonsoir » after. */
export function greetingKey(hour: number): "morning" | "evening" {
	return hour < 18 ? "morning" : "evening";
}

export function firstName(name: string): string {
	return name.trim().split(/\s+/)[0] ?? "";
}
