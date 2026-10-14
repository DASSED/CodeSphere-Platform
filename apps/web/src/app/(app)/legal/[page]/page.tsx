import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";

import {
	isLegalPage,
	LEGAL_PAGES,
	LEGAL_UPDATED_AT,
	legalHref,
} from "@/lib/legal";

type Section = { title: string; body: string };

export function generateStaticParams() {
	return LEGAL_PAGES.map((page) => ({ page }));
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ page: string }>;
}): Promise<Metadata> {
	const { page } = await params;
	if (!isLegalPage(page)) return {};
	const t = await getTranslations("legal.pages");
	return { title: `${t(`${page}.title`)} · CodeSphere` };
}

// Terms, privacy policy, legal notice and contact, in the reader's language (#56).
export default async function Page({
	params,
}: {
	params: Promise<{ page: string }>;
}) {
	const { page } = await params;
	if (!isLegalPage(page)) notFound();

	const t = await getTranslations("legal");
	const format = await getFormatter();
	// Raw so the bodies are not parsed as ICU messages.
	const sections = t.raw(`pages.${page}.sections`) as Record<string, Section>;

	return (
		<main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 md:px-8">
			<nav aria-label={t("nav")}>
				<ul className="flex flex-wrap gap-4 text-sm">
					{LEGAL_PAGES.map((other) => (
						<li key={other}>
							<a
								href={legalHref(other)}
								aria-current={other === page ? "page" : undefined}
								className="text-muted-foreground hover:text-foreground hover:underline aria-[current=page]:font-medium aria-[current=page]:text-foreground"
							>
								{t(`pages.${other}.title`)}
							</a>
						</li>
					))}
				</ul>
			</nav>

			<header className="flex flex-col gap-2">
				<h1 className="font-semibold text-3xl tracking-tight">
					{t(`pages.${page}.title`)}
				</h1>
				<p className="text-muted-foreground text-sm">
					{t("updated", {
						date: format.dateTime(new Date(LEGAL_UPDATED_AT), {
							dateStyle: "long",
						}),
					})}
				</p>
				<p className="text-muted-foreground">{t(`pages.${page}.intro`)}</p>
				<p className="rounded-md border border-dashed px-3 py-2 text-muted-foreground text-xs">
					{t("draft")}
				</p>
			</header>

			{Object.entries(sections).map(([key, section]) => (
				<section key={key} className="flex flex-col gap-3">
					<h2 className="font-semibold text-xl">{section.title}</h2>
					{section.body.split("\n\n").map((paragraph) => (
						<p key={paragraph} className="leading-relaxed">
							{paragraph}
						</p>
					))}
				</section>
			))}
		</main>
	);
}
