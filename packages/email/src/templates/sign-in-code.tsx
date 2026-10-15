/** @jsxImportSource react */
import { Text } from "@react-email/components";

import { DEFAULT_LOCALE, type Locale } from "../locale";
import { Layout, paragraph } from "./layout";

export type SignInCodeProps = {
	code: string;
	locale?: Locale;
};

export const SIGN_IN_CODE_SUBJECTS: Record<Locale, string> = {
	fr: "Votre code de connexion CodeSphere Platform",
	en: "Your CodeSphere Platform sign-in code",
};

const COPY: Record<
	Locale,
	{ preview: string; title: string; body: string; ignore: string }
> = {
	fr: {
		preview: "Votre code de connexion",
		title: "Votre code de connexion",
		body: "Saisissez ce code pour vous connecter à CodeSphere Platform. Il expire dans quelques minutes :",
		ignore:
			"Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.",
	},
	en: {
		preview: "Your sign-in code",
		title: "Your sign-in code",
		body: "Enter this code to sign in to CodeSphere Platform. It expires in a few minutes:",
		ignore: "If you did not request this, you can ignore this message.",
	},
};

export function SignInCode({ code, locale = DEFAULT_LOCALE }: SignInCodeProps) {
	const copy = COPY[locale];
	return (
		<Layout locale={locale} preview={copy.preview} title={copy.title}>
			<Text style={paragraph}>{copy.body}</Text>
			<Text
				style={{
					...paragraph,
					fontSize: 28,
					fontWeight: 700,
					letterSpacing: 6,
				}}
			>
				{code}
			</Text>
			<Text style={paragraph}>{copy.ignore}</Text>
		</Layout>
	);
}
