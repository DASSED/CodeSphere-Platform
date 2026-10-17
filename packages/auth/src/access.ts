import type { Role } from "@codesphere/contract/roles";
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/admin/access";

// Access control of Better Auth's admin plugin (#120): what each role may do, as resource/action
// pairs. Shared by the server (packages/auth) and the web client, so a screen can ask the same
// question the API answers. The roles themselves come from the contract and the Postgres enum.
//
// The back-office resources mirror the admin procedures of the API. The plugin's own `user` and
// `session` resources stay almost entirely closed: roles are derived from the staff email lists at
// each sign-in, suspension has its own audited flow, so no role may set a role, ban, impersonate,
// delete, or reset a password through the plugin's /admin endpoints.
export const statement = {
	...defaultStatements,
	moderation: ["list", "suspend", "reactivate"],
	tag: ["list", "create", "rename", "delete"],
	hackathon: ["update"],
	audit: ["read"],
	kpi: ["read"],
} as const;

export const ac = createAccessControl(statement);

const backOffice = {
	moderation: ["list", "suspend", "reactivate"],
	tag: ["list", "create", "rename", "delete"],
	hackathon: ["update"],
	audit: ["read"],
	kpi: ["read"],
	user: ["list", "get"],
	session: ["list"],
} as const;

// Every staff role reaches the same screens; what separates them is rank (outranks): a staff
// member only moderates a strictly lower role.
export const roles = {
	member: ac.newRole({}),
	moderator: ac.newRole(backOffice),
	admin: ac.newRole(backOffice),
	super_admin: ac.newRole(backOffice),
} satisfies Record<Role, unknown>;
