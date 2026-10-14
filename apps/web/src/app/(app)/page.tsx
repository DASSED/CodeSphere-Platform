"use client";

import type { Hackathon } from "@codesphere/contract";
import { Button } from "@codesphere/ui/components/atoms/button";
import { Skeleton } from "@codesphere/ui/components/atoms/skeleton";
import { CadevBanner } from "@codesphere/ui/components/molecules/cadev-banner";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@codesphere/ui/components/molecules/empty";
import { SegmentedControl } from "@codesphere/ui/components/molecules/segmented-control";
import { useQuery } from "@tanstack/react-query";
import { CheckIcon, MessageSquareIcon, TagIcon } from "lucide-react";
import Link from "next/link";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import type * as z from "zod";

import { AskButton } from "@/components/site-header";
import TagsOnboardingRedirect from "@/components/tags-onboarding-redirect";
import { authClient } from "@/lib/auth-client";
import { HAS_DATABASE } from "@/lib/deployment";
import { firstName, greetingKey, submissionClose } from "@/lib/home";
import { useMounted } from "@/lib/use-mounted";
import { orpc } from "@/utils/orpc";

type HackathonData = z.infer<typeof Hackathon>;

// Home (#130, design from the home prototype): desktop visitor = one centred column with the
// banner; desktop Member = feed and a sticky rail; phone = promise for a visitor, greeting and a
// compact ribbon for a Member. The feed itself (tabs, cards) arrives with « Flux B » (#66).
export default function Home() {
	const { data: session, isPending } = authClient.useSession();
	// Without a database (a preview without the preview-db label) the banner is simply absent.
	const hackathon = useQuery({
		...orpc.hackathons.get.queryOptions({ input: { slug: "cadev-2026" } }),
		enabled: HAS_DATABASE,
	});
	if (isPending) {
		return <PageSkeleton />;
	}
	return session ? (
		<MemberHome name={session.user.name} hackathon={hackathon.data} />
	) : (
		<VisitorHome hackathon={hackathon.data} />
	);
}

function useBannerLabels() {
	const t = useTranslations("home.banner");
	return {
		eyebrow: t("eyebrow"),
		days: t("days"),
		hours: t("hours"),
		remaining: (days: number) => t("remaining", { days }),
		timeline: t("timeline"),
	};
}

function Banner({
	hackathon,
	variant = "card",
	className,
}: {
	hackathon: HackathonData | undefined;
	variant?: "card" | "ribbon" | "rail";
	className?: string;
}) {
	const t = useTranslations("home.banner");
	const labels = useBannerLabels();
	const format = useFormatter();
	const locale = useLocale();
	const mounted = useMounted();
	if (!hackathon) {
		return (
			<Skeleton
				className={
					variant === "ribbon" ? "h-16 rounded-xl" : "h-56 rounded-3xl"
				}
			/>
		);
	}
	const closesAt = submissionClose(hackathon.milestones);
	if (!closesAt) {
		return null;
	}
	// The viewer's timezone and the app's locale, once in the browser only (no hydration mismatch).
	const date = mounted
		? format.dateTime(new Date(closesAt), {
				day: "numeric",
				month: "long",
				hour: "numeric",
				minute: "2-digit",
				timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			})
		: "…";
	const see = (
		<Button
			variant={variant === "rail" ? "outline" : "secondary"}
			size="sm"
			disabled
			title={t("soon")}
		>
			{t("see")}
		</Button>
	);
	return (
		<CadevBanner
			className={className}
			variant={variant}
			locale={locale}
			name={hackathon.name}
			summary={hackathon.summary}
			closesAt={closesAt}
			milestones={hackathon.milestones}
			labels={{ ...labels, closes: t("closes", { date }) }}
			action={variant === "ribbon" ? undefined : see}
		/>
	);
}

const TABS = ["forYou", "recent", "unanswered"] as const;
type TabKey = (typeof TABS)[number];

function FeedTabs({ signedIn }: { signedIn: boolean }) {
	const t = useTranslations("home.tabs");
	// Keyed by id, not by label: switching language keeps the selected tab.
	const [tab, setTab] = useState<TabKey>(signedIn ? "forYou" : "recent");
	const labels = TABS.map((key) => t(key));
	return (
		<div className="flex flex-wrap items-center justify-between gap-3">
			<SegmentedControl
				options={labels}
				value={t(tab)}
				onValueChange={(label) => setTab(TABS[labels.indexOf(label)] ?? tab)}
			/>
			{!signedIn && tab === "forYou" && (
				<p className="text-muted-foreground text-sm">{t("signInForYou")}</p>
			)}
		</div>
	);
}

function EmptyFeed({ signedIn }: { signedIn: boolean }) {
	const t = useTranslations("home.empty");
	return (
		<Empty className="rounded-3xl border border-border bg-card py-12">
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<MessageSquareIcon />
				</EmptyMedia>
				<EmptyTitle>{t("title")}</EmptyTitle>
				<EmptyDescription>
					{signedIn ? t("member") : t("visitor")}
				</EmptyDescription>
			</EmptyHeader>
			<EmptyContent className="flex-row flex-wrap justify-center">
				<AskButton />
				{signedIn && (
					<Button
						variant="outline"
						render={<Link href="/onboarding/tags" />}
						nativeButton={false}
					>
						<TagIcon />
						{t("followTags")}
					</Button>
				)}
			</EmptyContent>
		</Empty>
	);
}

function VisitorHome({ hackathon }: { hackathon: HackathonData | undefined }) {
	const t = useTranslations("home.hero");
	return (
		<main className="mx-auto grid max-w-3xl gap-6 px-4 py-6 md:px-6 md:py-8">
			{/* Phone only: the promise before the feed (variant 4 of the prototype). */}
			<section className="grid gap-3 pt-4 md:hidden">
				<p className="font-mono font-semibold text-[0.68rem] text-muted-foreground uppercase tracking-widest">
					{t("eyebrow")}
				</p>
				<h1 className="text-balance font-bold text-3xl leading-tight tracking-tight">
					{t("title")}
				</h1>
				<p className="text-muted-foreground">{t("lead")}</p>
			</section>
			<Banner hackathon={hackathon} />
			<FeedTabs signedIn={false} />
			<EmptyFeed signedIn={false} />
		</main>
	);
}

function MemberHome({
	name,
	hackathon,
}: {
	name: string;
	hackathon: HackathonData | undefined;
}) {
	const t = useTranslations("home");
	const mounted = useMounted();
	// The viewer's hour, read in the browser only: the server would use its own timezone.
	const greeting = mounted
		? t(`hello.${greetingKey(new Date().getHours())}`, {
				name: firstName(name),
			})
		: null;
	return (
		<main className="mx-auto grid max-w-6xl gap-8 px-4 py-6 md:grid-cols-[minmax(0,1fr)_20rem] md:px-6 md:py-8">
			{/* Tags are read from the database: without one there is nothing to onboard. */}
			{HAS_DATABASE && <TagsOnboardingRedirect />}
			<div className="grid min-w-0 content-start gap-5">
				{/* Phone only: greeting and compact ribbon (variant 4). */}
				<div className="grid gap-4 md:hidden">
					<div>
						{greeting ? (
							<h1 className="font-bold text-2xl tracking-tight">{greeting}</h1>
						) : (
							<Skeleton className="h-8 w-48" />
						)}
						<p className="text-muted-foreground">{t("hello.lead")}</p>
					</div>
					<Banner hackathon={hackathon} variant="ribbon" />
				</div>
				<FeedTabs signedIn />
				<EmptyFeed signedIn />
			</div>
			{/* Desktop only: sticky rail (variant 3). */}
			<aside className="sticky top-24 hidden content-start gap-4 self-start md:grid">
				<Banner hackathon={hackathon} variant="rail" />
				<section className="grid gap-3 rounded-2xl border border-border bg-card p-5">
					<p className="font-mono font-semibold text-[0.68rem] text-muted-foreground uppercase tracking-widest">
						{t("start.title")}
					</p>
					<ul className="grid gap-2 text-sm">
						<li className="flex items-center gap-2">
							<span className="grid size-5 place-items-center rounded-full bg-emerald-600 text-white">
								<CheckIcon className="size-3" />
							</span>
							{t("start.account")}
						</li>
						<li className="flex items-center gap-2 text-muted-foreground">
							<span className="size-5 rounded-full border border-border" />
							{t("start.tags")}
						</li>
						<li className="flex items-center gap-2 text-muted-foreground">
							<span className="size-5 rounded-full border border-border" />
							{t("start.question")}
						</li>
					</ul>
				</section>
				<section className="grid gap-2 rounded-2xl border border-border bg-card p-5">
					<p className="font-mono font-semibold text-[0.68rem] text-muted-foreground uppercase tracking-widest">
						{t("followed.title")}
					</p>
					<p className="text-muted-foreground text-sm">{t("followed.none")}</p>
				</section>
			</aside>
		</main>
	);
}

function PageSkeleton() {
	return (
		<main className="mx-auto grid max-w-3xl gap-6 px-4 py-8">
			<Skeleton className="h-56 rounded-3xl" />
			<Skeleton className="h-10 w-72 rounded-xl" />
			<Skeleton className="h-64 rounded-3xl" />
		</main>
	);
}
