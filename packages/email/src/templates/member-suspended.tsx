/** @jsxImportSource react */
import { Text } from "@react-email/components";

import { DEFAULT_LOCALE, type Locale } from "../locale";
import { Layout, paragraph } from "./layout";

export type MemberSuspendedProps = {
	name: string;
	/** The reason the Admin recorded, shown as written. Omitted when none was given. */
	reason?: string;
	locale?: Locale;
};

export const MEMBER_SUSPENDED_SUBJECTS: Record<Locale, string> = {
	fr: "Votre compte CodeSphere est suspendu",
	en: "Your CodeSphere account is suspended",
};

const COPY: Record<
	Locale,
	{
		preview: string;
		title: string;
		body: (name: string) => string;
		reason: string;
		contest: string;
	}
> = {
	fr: {
		preview: "Votre compte a été suspendu par un administrateur",
		title: "Compte suspendu",
		body: (name) =>
			`Bonjour ${name}, un administrateur a suspendu votre compte CodeSphere. Vous ne pouvez plus publier tant que la suspension dure.`,
		reason: "Motif indiqué :",
		contest:
			"Si vous pensez qu'il s'agit d'une erreur, écrivez-nous depuis la page de contact de CodeSphere.",
	},
	en: {
		preview: "An administrator has suspended your account",
		title: "Account suspended",
		body: (name) =>
			`Hello ${name}, an administrator has suspended your CodeSphere account. You cannot post while the suspension lasts.`,
		reason: "Reason given:",
		contest:
			"If you believe this is a mistake, write to us from the CodeSphere contact page.",
	},
};

export function MemberSuspended({
	name,
	reason,
	locale = DEFAULT_LOCALE,
}: MemberSuspendedProps) {
	const copy = COPY[locale];
	return (
		<Layout locale={locale} preview={copy.preview} title={copy.title}>
			<Text style={paragraph}>{copy.body(name)}</Text>
			{reason ? (
				<Text style={paragraph}>{`${copy.reason} ${reason}`}</Text>
			) : null}
			<Text style={paragraph}>{copy.contest}</Text>
		</Layout>
	);
}
