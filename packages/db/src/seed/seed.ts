import type { Database } from "../index";
import {
	hackathon,
	hackathonCriterion,
	hackathonMilestone,
	hackathonPrize,
} from "../schema/hackathons";
import { tag } from "../schema/tags";
import { cadev2026, type SeedHackathon } from "./cadev";
import { STARTER_TAGS } from "./tags";

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

/** Inserts the starting Tags, once each; a Tag that exists (or was renamed by an Admin) is left alone. */
export async function seedTags(
	db: Database,
	names: readonly string[] = STARTER_TAGS,
): Promise<{ created: number; kept: number }> {
	const created = await db
		.insert(tag)
		.values(names.map((name) => ({ name })))
		.onConflictDoNothing({ target: tag.name })
		.returning({ id: tag.id });
	return { created: created.length, kept: names.length - created.length };
}

/** Every starting value of the platform: the CADEV 2026 and the starting Tags (#61). */
export async function seed(db: Database) {
	return {
		"cadev-2026": await seedHackathon(db, cadev2026),
		tags: await seedTags(db),
	};
}
