/** @jsxImportSource react */
import { Text } from "@react-email/components";

import { DEFAULT_LOCALE, type Locale } from "../locale";
import { Layout, paragraph } from "./layout";

export type AccountDeletedProps = {
	name: string;
	locale?: Locale;
};

export const ACCOUNT_DELETED_SUBJECTS: Record<Locale, string> = {
	fr: "Votre compte CodeSphere Platform a été supprimé",
	en: "Your CodeSphere Platform account has been deleted",
};

const COPY: Record<
	Locale,
	{
		preview: string;
		title: string;
		body: (name: string) => string;
		after: string;
	}
> = {
	fr: {
		preview: "La suppression de votre compte est effective",
		title: "Compte supprimé",
		body: (name) =>
			`Bonjour ${name}, la suppression de votre compte CodeSphere Platform est effective. Vos données personnelles ont été effacées ou anonymisées.`,
		after:
			"Vous pouvez à tout moment créer un nouveau compte par SSO. Il ne reprendra rien de l'ancien.",
	},
	en: {
		preview: "Your account deletion is complete",
		title: "Account deleted",
		body: (name) =>
			`Hello ${name}, the deletion of your CodeSphere Platform account is complete. Your personal data has been erased or anonymised.`,
		after:
			"You can create a new account through SSO at any time. It will carry nothing over from the old one.",
	},
};

export function AccountDeleted({
	name,
	locale = DEFAULT_LOCALE,
}: AccountDeletedProps) {
	const copy = COPY[locale];
	return (
		<Layout locale={locale} preview={copy.preview} title={copy.title}>
			<Text style={paragraph}>{copy.body(name)}</Text>
			<Text style={paragraph}>{copy.after}</Text>
		</Layout>
	);
}
