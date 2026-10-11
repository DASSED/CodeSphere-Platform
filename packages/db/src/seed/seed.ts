import type { Database } from "../index";
import {
	hackathon,
	hackathonCriterion,
	hackathonMilestone,
	hackathonPrize,
} from "../schema/hackathons";
import { cadev2026, type SeedHackathon } from "./cadev";

/**
 * Inserts a Hackathon with its starting values, once. Replaying the seed changes nothing: an
 * existing slug is left untouched, so the edits an Admin made in the back-office survive (#61).
 */
export async function seedHackathon(
	db: Database,
	data: SeedHackathon,
): Promise<"created" | "kept"> {
	const { milestones, prizes, criteria, ...fields } = data;
	const [created] = await db
		.insert(hackathon)
		.values(fields)
		.onConflictDoNothing({ target: hackathon.slug })
		.returning({ id: hackathon.id });
	if (!created) {
		return "kept";
	}
	const hackathonId = created.id;
	if (milestones.length) {
		await db
			.insert(hackathonMilestone)
			.values(
				milestones.map((m, position) => ({ ...m, hackathonId, position })),
			);
	}
	if (prizes.length) {
		await db
			.insert(hackathonPrize)
			.values(prizes.map((p, position) => ({ ...p, hackathonId, position })));
	}
	if (criteria.length) {
		await db
			.insert(hackathonCriterion)
			.values(criteria.map((c, position) => ({ ...c, hackathonId, position })));
	}
	return "created";
}

/** Every starting value of the platform. Tags are seeded by the Tags ticket (#44), not here. */
export async function seed(db: Database) {
	return { "cadev-2026": await seedHackathon(db, cadev2026) };
}
