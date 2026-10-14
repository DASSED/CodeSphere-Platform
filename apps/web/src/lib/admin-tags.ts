import { adminErrorKey } from "@/i18n/errors";

type TagLike = {
	questionCount: number;
	ownerHackathon: string | null;
};

export type TagGroup = "protected" | "used" | "unused";

/** The group of the Tags list (#117): the rule made visible. */
export function tagGroup(tag: TagLike): TagGroup {
	if (tag.ownerHackathon) {
		return "protected";
	}
	return tag.questionCount > 0 ? "used" : "unused";
}

/** Why a Tag cannot be deleted, or `null` when it can; shown before the action. */
export function deleteBlock(tag: TagLike): string | null {
	if (tag.ownerHackathon) {
		return `Protégé : possédé par le Hackathon ${tag.ownerHackathon}`;
	}
	if (tag.questionCount > 0) {
		return `Utilisé par ${tag.questionCount} Question${tag.questionCount > 1 ? "s" : ""}`;
	}
	return null;
}

export const tagMutationErrorKey = adminErrorKey;
