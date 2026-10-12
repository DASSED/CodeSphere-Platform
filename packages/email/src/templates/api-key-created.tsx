/** @jsxImportSource react */
import { Text } from "@react-email/components";

import { DEFAULT_LOCALE, type Locale } from "../locale";
import { Layout, paragraph } from "./layout";

export type ApiKeyCreatedProps = {
	name: string;
	/** The label the member gave the key. The key itself is never sent by email. */
	keyName: string;
	locale?: Locale;
};

export const API_KEY_CREATED_SUBJECTS: Record<Locale, string> = {
	fr: "Une clé API a été créée sur votre compte",
	en: "An API key was created on your account",
};

const COPY: Record<
	Locale,
	{
		preview: string;
		title: string;
		body: (name: string, keyName: string) => string;
		warning: string;
	}
> = {
	fr: {
		preview: "Une nouvelle clé API est active",
		title: "Nouvelle clé API",
		body: (name, keyName) =>
			`Bonjour ${name}, la clé API « ${keyName} » vient d'être créée sur votre compte. Elle n'est jamais envoyée par e-mail : elle n'a été affichée qu'une fois, à sa création.`,
		warning:
			"Si vous n'êtes pas à l'origine de cette action, révoquez la clé depuis vos paramètres sans attendre.",
	},
	en: {
		preview: "A new API key is active",
		title: "New API key",
		body: (name, keyName) =>
			`Hello ${name}, the API key "${keyName}" was just created on your account. It is never sent by email: it was shown once, when it was created.`,
		warning:
			"If you did not do this, revoke the key from your settings right away.",
	},
};

export function ApiKeyCreated({
	name,
	keyName,
	locale = DEFAULT_LOCALE,
}: ApiKeyCreatedProps) {
	const copy = COPY[locale];
	return (
		<Layout locale={locale} preview={copy.preview} title={copy.title}>
			<Text style={paragraph}>{copy.body(name, keyName)}</Text>
			<Text style={paragraph}>{copy.warning}</Text>
		</Layout>
	);
}
