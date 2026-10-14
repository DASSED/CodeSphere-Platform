import type { KpiMetric } from "@codesphere/contract";
import type { z } from "zod";

type Metric = z.infer<typeof KpiMetric>;
type MetricId = Metric["id"];

const RATES: readonly MetricId[] = ["answerRate", "acceptedRate", "agentShare"];

/** Metrics where a decrease is good: the card shows it in green. */
export const LOWER_IS_BETTER: readonly MetricId[] = [
	"medianFirstAnswerMinutes",
	"unanswered",
];

/** A duration in minutes as « 45 min », « 2 h 10 » or « 3 j 4 h ». */
export function formatMinutes(minutes: number): string {
	const total = Math.round(minutes);
	if (total < 60) return `${total} min`;
	const hours = Math.floor(total / 60);
	if (hours < 24) {
		return `${hours} h ${String(total % 60).padStart(2, "0")}`;
	}
	return `${Math.floor(hours / 24)} j ${hours % 24} h`;
}

/** The value of a metric as the card shows it; null when the metric has no value. */
export function formatMetric(
	id: MetricId,
	value: number | null,
	locale: string,
): string | null {
	if (value === null) return null;
	if (RATES.includes(id)) {
		return new Intl.NumberFormat(locale, {
			style: "percent",
			maximumFractionDigits: 0,
		}).format(value);
	}
	if (id === "medianFirstAnswerMinutes") return formatMinutes(value);
	return new Intl.NumberFormat(locale).format(value);
}

/** Change versus the previous window, in percent; none without a non-zero previous value. */
export function deltaOf(
	value: number | null,
	previous: number | null,
): number | undefined {
	if (value === null || previous === null || previous === 0) return undefined;
	return Math.round(((value - previous) / previous) * 1000) / 10;
}
