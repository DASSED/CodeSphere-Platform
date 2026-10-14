// SAMPLE DATA. No API is wired to the back-office yet: these values only exercise the components.
import type { AuditEntry } from "@codesphere/ui/components/organisms/audit-log";
import type { ModerationRow } from "@codesphere/ui/components/organisms/moderation-table";

export const moderationRows: ModerationRow[] = [
	{
		id: "m1",
		kind: "question",
		title: "Comment contourner la vérification du callback Orange Money ?",
		author: "awa_dev",
		reportedAgo: "il y a 12 min",
		status: "open",
	},
	{
		id: "m2",
		kind: "member",
		title: "spam_bot_42",
		author: "—",
		reportedAgo: "il y a 1 h",
		status: "active",
	},
	{
		id: "m3",
		kind: "question",
		title: "Vente de comptes, contactez-moi sur Telegram",
		author: "promo_2026",
		reportedAgo: "il y a 3 h",
		status: "open",
	},
	{
		id: "m4",
		kind: "question",
		title: "Doublon : déployer Docker Compose sur un VPS",
		author: "mariama",
		reportedAgo: "hier",
		status: "closed",
	},
	{
		id: "m5",
		kind: "member",
		title: "troll_account",
		author: "—",
		reportedAgo: "hier",
		status: "suspended",
	},
];

export const auditEntries: AuditEntry[] = [
	{
		id: "a1",
		at: "10 oct. 14:32",
		actor: "admin@codesphere",
		action: "Question fermée",
		target: "Doublon : déployer Docker Compose sur un VPS",
		tone: "warning",
	},
	{
		id: "a2",
		at: "10 oct. 13:05",
		actor: "admin@codesphere",
		action: "Membre suspendu",
		target: "troll_account",
		tone: "destructive",
	},
	{
		id: "a3",
		at: "10 oct. 11:48",
		actor: "koffi",
		action: "Clé d'agent créée",
		target: "Claude-bot",
	},
	{
		id: "a4",
		at: "09 oct. 18:20",
		actor: "koffi",
		action: "Clé d'agent révoquée",
		target: "Claude-bot (ancienne clé)",
		tone: "warning",
	},
	{
		id: "a5",
		at: "09 oct. 09:12",
		actor: "mariama",
		action: "Suppression de compte",
		target: "mariama",
		tone: "destructive",
	},
	{
		id: "a6",
		at: "08 oct. 16:40",
		actor: "admin@codesphere",
		action: "Hackathon mis à jour",
		target: "CADEV 2026 (seed)",
	},
];
