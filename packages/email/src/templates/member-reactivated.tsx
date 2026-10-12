/** @jsxImportSource react */
import { Text } from "@react-email/components";

import { DEFAULT_LOCALE, type Locale } from "../locale";
import { Layout, paragraph } from "./layout";

export type MemberReactivatedProps = {
	name: string;
	locale?: Locale;
};

export const MEMBER_REACTIVATED_SUBJECTS: Record<Locale, string> = {
	fr: "Votre compte CodeSphere est réactivé",
	en: "Your CodeSphere account is active again",
};

const COPY: Record<
	Locale,
	{ preview: string; title: string; body: (name: string) => string }
> = {
	fr: {
		preview: "Vous pouvez de nouveau publier",
		title: "Compte réactivé",
		body: (name) =>
			`Bonjour ${name}, votre compte CodeSphere est de nouveau actif. Vous pouvez publier et répondre comme avant.`,
	},
	en: {
		preview: "You can post again",
		title: "Account reactivated",
		body: (name) =>
			`Hello ${name}, your CodeSphere account is active again. You can post and answer as before.`,
	},
};

export function MemberReactivated({
	name,
	locale = DEFAULT_LOCALE,
}: MemberReactivatedProps) {
	const copy = COPY[locale];
	return (
		<Layout locale={locale} preview={copy.preview} title={copy.title}>
			<Text style={paragraph}>{copy.body(name)}</Text>
		</Layout>
	);
}
