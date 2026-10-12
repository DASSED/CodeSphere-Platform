/** @jsxImportSource react */
import { Text } from "@react-email/components";

import { DEFAULT_LOCALE, type Locale } from "../locale";
import { Layout, paragraph } from "./layout";

export type WelcomeProps = {
	name: string;
	locale?: Locale;
};

export const WELCOME_SUBJECTS: Record<Locale, string> = {
	fr: "Bienvenue sur CodeSphere",
	en: "Welcome to CodeSphere",
};

/** English subject, kept for callers that predate the locale. */
export const WELCOME_SUBJECT = WELCOME_SUBJECTS.en;

const COPY: Record<
	Locale,
	{ preview: string; title: (name: string) => string; body: string }
> = {
	fr: {
		preview: "Votre compte CodeSphere est prêt",
		title: (name) => `Bienvenue, ${name}`,
		body: "Votre compte CodeSphere est prêt. Suivez quelques Tags pour composer votre fil « Pour vous », ou posez votre première Question.",
	},
	en: {
		preview: "Your CodeSphere account is ready",
		title: (name) => `Welcome, ${name}`,
		body: "Your CodeSphere account is ready. Follow a few Tags to shape your For You feed, or ask your first Question.",
	},
};

export function Welcome({ name, locale = DEFAULT_LOCALE }: WelcomeProps) {
	const copy = COPY[locale];
	return (
		<Layout locale={locale} preview={copy.preview} title={copy.title(name)}>
			<Text style={paragraph}>{copy.body}</Text>
		</Layout>
	);
}
