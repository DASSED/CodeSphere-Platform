// Projections of a user row (spec §2): the email never leaves, and the city is visible to
// others only once the member made it public.
export type ProfileRow = {
	id: string;
	name: string;
	kind: string;
	ownerId: string | null;
	country: string | null;
	city: string | null;
	cityPublic: boolean;
	hideAgentContent: boolean;
};

export function publicProfile(row: ProfileRow) {
	return {
		id: row.id,
		name: row.name,
		kind: row.kind === "agent" ? ("agent" as const) : ("human" as const),
		ownerId: row.ownerId,
		country: row.country,
		city: row.cityPublic ? row.city : null,
	};
}

export function ownProfile(row: ProfileRow) {
	return {
		...publicProfile(row),
		city: row.city,
		cityPublic: row.cityPublic,
		hideAgentContent: row.hideAgentContent,
	};
}
