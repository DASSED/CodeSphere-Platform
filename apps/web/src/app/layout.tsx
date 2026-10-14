import { AppFooter } from "@codesphere/ui/components/organisms/app-footer";
import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Outfit } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";

import "../index.css";
import Providers from "@/components/providers";
import { LEGAL_PAGES, legalHref } from "@/lib/legal";

// Google Fonts only (CADEV rule), self-hosted at build time by next/font.
const outfit = Outfit({
	subsets: ["latin", "latin-ext"],
	variable: "--font-outfit",
	display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
	subsets: ["latin", "latin-ext"],
	variable: "--font-jetbrains-mono",
	display: "swap",
});

export const metadata: Metadata = {
	title: "CodeSphere Platform",
	description: "Plateforme d'échange pour développeurs africains",
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
};

export default async function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const locale = await getLocale();
	const messages = await getMessages();
	const t = await getTranslations("legal");

	return (
		<html
			lang={locale}
			className={`${outfit.variable} ${jetbrainsMono.variable}`}
			suppressHydrationWarning
		>
			<body>
				<NextIntlClientProvider locale={locale} messages={messages}>
					<Providers>
						{children}
						<AppFooter
							version={process.env.APP_VERSION ?? "0.0.0"}
							sha={process.env.GIT_SHA ?? "dev"}
							navLabel={t("nav")}
							links={LEGAL_PAGES.map((page) => ({
								label: t(`pages.${page}.title`),
								href: legalHref(page),
							}))}
						/>
					</Providers>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
