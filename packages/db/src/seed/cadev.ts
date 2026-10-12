// Starting values of the CADEV 2026 (spec §2, #61). The calendar is the one the organisers sent
// the team (not published on their page), hence `sourceNote`. Prizes are left out until their
// amounts are confirmed: an Admin adds them from the back-office.
export type SeedHackathon = {
	slug: string;
	name: string;
	organizer: string;
	summary: string;
	teamMin: number;
	teamMax: number;
	sourceUrl: string;
	sourceNote: string | null;
	verifiedAt: Date;
	milestones: {
		key: string;
		label: string;
		startsAt: Date;
		endsAt: Date | null;
	}[];
	prizes: { label: string; amount: string | null; conditions: string | null }[];
	criteria: {
		label: string;
		weight: number;
		scoredBy: "jury" | "public" | "peers";
	}[];
};

const utc = (iso: string) => new Date(iso);

export const cadev2026: SeedHackathon = {
	slug: "cadev-2026",
	name: "Coupe d'Afrique des Développeurs 2026",
	organizer: "Systalink",
	summary:
		"Concours en ligne pour équipes de développeurs de l'Afrique francophone.",
	teamMin: 2,
	teamMax: 5,
	sourceUrl: "https://systalink.com/fr/coupe-afrique-des-developpeurs-cadev",
	sourceNote: "Calendrier communiqué par les organisateurs.",
	verifiedAt: utc("2026-10-11T00:00:00Z"),
	milestones: [
		{
			key: "submission_close",
			label: "Clôture des soumissions",
			startsAt: utc("2026-10-25T17:00:00Z"),
			endsAt: null,
		},
		{
			key: "peer_vote",
			label: "Votes entre participants d'un même pays (obligatoires)",
			startsAt: utc("2026-10-25T18:00:00Z"),
			endsAt: utc("2026-10-26T23:59:00Z"),
		},
		{
			key: "public_vote",
			label: "Vote du public",
			startsAt: utc("2026-10-27T00:00:00Z"),
			endsAt: utc("2026-10-30T23:59:00Z"),
		},
		{
			key: "jury",
			label: "Délibération du jury",
			startsAt: utc("2026-11-01T00:00:00Z"),
			endsAt: null,
		},
	],
	prizes: [],
	criteria: [
		{ label: "Pertinence", weight: 25, scoredBy: "jury" },
		{ label: "Qualité technique", weight: 30, scoredBy: "jury" },
		{ label: "Expérience utilisateur", weight: 20, scoredBy: "jury" },
		{ label: "Innovation", weight: 15, scoredBy: "jury" },
		{ label: "Vote du public", weight: 10, scoredBy: "public" },
	],
};
