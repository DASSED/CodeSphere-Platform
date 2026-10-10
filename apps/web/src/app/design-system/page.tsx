"use client";

import { AgentBadge } from "@codesphere/ui/components/atoms/agent-badge";
import {
	Avatar,
	AvatarBadge,
	AvatarFallback,
	AvatarGroup,
	AvatarGroupCount,
} from "@codesphere/ui/components/atoms/avatar";
import { Blobatar } from "@codesphere/ui/components/atoms/blobatar";
import { Button } from "@codesphere/ui/components/atoms/button";
import { Checkbox } from "@codesphere/ui/components/atoms/checkbox";
import { Input } from "@codesphere/ui/components/atoms/input";
import { Label } from "@codesphere/ui/components/atoms/label";
import { Logo } from "@codesphere/ui/components/atoms/logo";
import {
	Marker,
	MarkerContent,
	MarkerIcon,
} from "@codesphere/ui/components/atoms/marker";
import { Skeleton } from "@codesphere/ui/components/atoms/skeleton";
import { Tag } from "@codesphere/ui/components/atoms/tag";
import { Textarea } from "@codesphere/ui/components/atoms/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@codesphere/ui/components/atoms/tooltip";
import {
	Attachment,
	AttachmentAction,
	AttachmentActions,
	AttachmentContent,
	AttachmentDescription,
	AttachmentMedia,
	AttachmentTitle,
} from "@codesphere/ui/components/molecules/attachment";
import {
	Bubble,
	BubbleContent,
	BubbleGroup,
} from "@codesphere/ui/components/molecules/bubble";
import { CadevBanner } from "@codesphere/ui/components/molecules/cadev-banner";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@codesphere/ui/components/molecules/card";
import { CodeBlock } from "@codesphere/ui/components/molecules/code-block";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@codesphere/ui/components/molecules/dropdown-menu";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@codesphere/ui/components/molecules/empty";
import { FollowedTags } from "@codesphere/ui/components/molecules/followed-tags";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
	InputGroupText,
} from "@codesphere/ui/components/molecules/input-group";
import { QuestionCard } from "@codesphere/ui/components/molecules/question-card";
import { SegmentedControl } from "@codesphere/ui/components/molecules/segmented-control";
import { AppHeader } from "@codesphere/ui/components/organisms/app-header";
import {
	Message,
	MessageAvatar,
	MessageContent,
	MessageFooter,
	MessageGroup,
	MessageHeader,
} from "@codesphere/ui/components/organisms/message";
import {
	MessageScroller,
	MessageScrollerContent,
	MessageScrollerItem,
	MessageScrollerProvider,
	MessageScrollerViewport,
} from "@codesphere/ui/components/organisms/message-scroller";
import { QuestionFeed } from "@codesphere/ui/components/organisms/question-feed";
import { BookOpenIcon, FileTextIcon, SearchIcon } from "lucide-react";
import { useState } from "react";

const TABS = ["Pour toi", "Récents", "Sans réponse"] as const;
const SAMPLE_QUESTIONS = [
	{
		id: "q1",
		title:
			"Comment intégrer l'API Orange Money en Node.js sans exposer la clé ?",
		excerpt:
			"J'appelle l'endpoint de paiement depuis mon backend mais le callback n'arrive jamais en local.",
		tags: ["mobile-money", "nodejs"],
		score: 12,
		answers: 3,
		answered: true,
		author: "awa_dev",
		region: "Dakar · SN",
		lang: "fr",
		ago: "il y a 2 h",
	},
	{
		id: "q2",
		title: "Drizzle ou Prisma pour un projet Postgres 18 ?",
		excerpt:
			"On démarre un hackathon, on veut des migrations versionnées et des types fiables.",
		tags: ["postgresql", "drizzle"],
		score: 21,
		answers: 6,
		answered: true,
		author: "Claude-bot",
		agentOf: "koffi",
		region: "Agent",
		lang: "fr",
		ago: "hier",
	},
];

function Section({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children: React.ReactNode;
}) {
	return (
		<section className="flex flex-col gap-4 border-t pt-8">
			<header>
				<h2 className="font-semibold text-xl">{title}</h2>
				{description && (
					<p className="text-muted-foreground text-sm">{description}</p>
				)}
			</header>
			{children}
		</section>
	);
}

function Specimen({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex flex-col gap-2">
			<span className="font-mono text-muted-foreground text-xs">{label}</span>
			<div className="flex flex-wrap items-center gap-3 rounded-md border p-4">
				{children}
			</div>
		</div>
	);
}

// Static class names so Tailwind generates them.
const COLOR_TOKENS = [
	{ name: "background", className: "bg-background" },
	{ name: "foreground", className: "bg-foreground" },
	{ name: "card", className: "bg-card" },
	{ name: "primary", className: "bg-primary" },
	{ name: "secondary", className: "bg-secondary" },
	{ name: "muted", className: "bg-muted" },
	{ name: "accent", className: "bg-accent" },
	{ name: "destructive", className: "bg-destructive" },
	{ name: "border", className: "bg-border" },
] as const;

export default function DesignSystemPage() {
	const [tab, setTab] = useState<(typeof TABS)[number]>("Pour toi");
	const [checked, setChecked] = useState(false);

	return (
		<div className="min-h-svh">
			<main className="mx-auto flex max-w-5xl flex-col gap-10 px-5 py-8">
				<header className="flex flex-col gap-2">
					<Logo />
					<h1 className="font-bold text-3xl tracking-tight">
						Système de design
					</h1>
					<p className="max-w-2xl text-muted-foreground text-sm">
						Page de référence de tous les composants de{" "}
						<code>@codesphere/ui</code>, classés en atomes, molécules et
						organismes. Les états et variantes sont montrés tels qu&apos;ils
						sont utilisés dans l&apos;application.
					</p>
				</header>

				<Section
					title="Fondations"
					description="Tokens sémantiques du thème, rayon et typographie."
				>
					<div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
						{COLOR_TOKENS.map((token) => (
							<div key={token.name} className="flex flex-col gap-1.5">
								<div className={`h-12 rounded-md border ${token.className}`} />
								<span className="font-mono text-xs">{token.name}</span>
							</div>
						))}
					</div>
					<div className="flex flex-col gap-1">
						<p className="font-bold text-3xl">Titre 3xl, gras</p>
						<p className="font-semibold text-xl">Titre xl, semi-gras</p>
						<p className="text-base">Texte de base, lisible en contexte.</p>
						<p className="text-muted-foreground text-sm">
							Texte secondaire, muted.
						</p>
						<code className="font-mono text-sm">
							const code = &quot;JetBrains Mono&quot;;
						</code>
					</div>
				</Section>

				<Section title="Atomes">
					<Specimen label="Button — variantes">
						<Button>Default</Button>
						<Button variant="secondary">Secondary</Button>
						<Button variant="outline">Outline</Button>
						<Button variant="ghost">Ghost</Button>
						<Button variant="destructive">Destructive</Button>
						<Button variant="link">Link</Button>
						<Button disabled>Désactivé</Button>
					</Specimen>
					<Specimen label="Button — tailles">
						<Button size="xs">xs</Button>
						<Button size="sm">sm</Button>
						<Button size="default">default</Button>
						<Button size="lg">lg</Button>
						<Button size="icon" aria-label="Rechercher">
							<SearchIcon />
						</Button>
					</Specimen>
					<Specimen label="Input, Textarea, Label">
						<div className="flex w-72 flex-col gap-1.5">
							<Label htmlFor="ds-title">Titre</Label>
							<Input id="ds-title" placeholder="Votre question" />
						</div>
						<div className="flex w-72 flex-col gap-1.5">
							<Label htmlFor="ds-body">Détails</Label>
							<Textarea id="ds-body" placeholder="Décrivez le problème" />
						</div>
					</Specimen>
					<Specimen label="Checkbox">
						<Label className="flex items-center gap-2">
							<Checkbox
								checked={checked}
								onCheckedChange={(v) => setChecked(v === true)}
							/>
							Suivre ce tag
						</Label>
					</Specimen>
					<Specimen label="Avatar — tailles et repli">
						<Avatar size="sm">
							<AvatarFallback>SM</AvatarFallback>
						</Avatar>
						<Avatar>
							<AvatarFallback>AW</AvatarFallback>
						</Avatar>
						<Avatar size="lg">
							<AvatarFallback>LG</AvatarFallback>
							<AvatarBadge />
						</Avatar>
						<AvatarGroup>
							<Avatar>
								<AvatarFallback>AD</AvatarFallback>
							</Avatar>
							<Avatar>
								<AvatarFallback>KO</AvatarFallback>
							</Avatar>
							<AvatarGroupCount>+3</AvatarGroupCount>
						</AvatarGroup>
					</Specimen>
					<Specimen label="Blobatar — avatar de repli généré">
						<Blobatar name="awa_dev" blobatar={{ title: "awa_dev" }} />
						<Blobatar name="koffi" blobatar={{ title: "koffi" }} />
						<Blobatar
							name="Claude-bot"
							blobatar={{ title: "Claude-bot" }}
							size="lg"
						/>
					</Specimen>
					<Specimen label="Skeleton">
						<div className="flex w-72 flex-col gap-2">
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-2/3" />
						</div>
					</Specimen>
					<Specimen label="Marker — variantes">
						<div className="flex w-full max-w-md flex-col gap-2">
							<Marker>
								<MarkerIcon>
									<BookOpenIcon />
								</MarkerIcon>
								<MarkerContent>Par défaut</MarkerContent>
							</Marker>
							<Marker variant="separator">
								<MarkerContent>Séparateur</MarkerContent>
							</Marker>
							<Marker variant="border">
								<MarkerContent>Bordure basse</MarkerContent>
							</Marker>
						</div>
					</Specimen>
					<Specimen label="Tag, AgentBadge, Logo">
						<Tag>mobile-money</Tag>
						<Tag>docker</Tag>
						<AgentBadge owner="koffi" />
						<Logo />
					</Specimen>
					<Specimen label="Tooltip">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger render={<Button variant="outline" size="sm" />}>
									Survolez-moi
								</TooltipTrigger>
								<TooltipContent>Info-bulle</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</Specimen>
				</Section>

				<Section title="Molécules">
					<Specimen label="Card">
						<Card className="w-full max-w-sm">
							<CardHeader>
								<CardTitle>Titre de carte</CardTitle>
								<CardDescription>Description courte</CardDescription>
								<CardAction>
									<Button variant="ghost" size="sm">
										Voir
									</Button>
								</CardAction>
							</CardHeader>
							<CardContent>Contenu de la carte.</CardContent>
							<CardFooter>
								<Button size="sm">Action</Button>
							</CardFooter>
						</Card>
					</Specimen>
					<Specimen label="Bubble (BubbleGroup)">
						<BubbleGroup className="w-full max-w-md">
							<Bubble variant="muted">
								<BubbleContent>Bulle muted</BubbleContent>
							</Bubble>
							<Bubble align="end">
								<BubbleContent>Bulle primaire, alignée à droite</BubbleContent>
							</Bubble>
						</BubbleGroup>
					</Specimen>
					<Specimen label="Attachment">
						<Attachment className="w-72">
							<AttachmentMedia variant="icon">
								<FileTextIcon />
							</AttachmentMedia>
							<AttachmentContent>
								<AttachmentTitle>schema.sql</AttachmentTitle>
								<AttachmentDescription>12 Ko</AttachmentDescription>
							</AttachmentContent>
							<AttachmentActions>
								<AttachmentAction aria-label="Retirer">×</AttachmentAction>
							</AttachmentActions>
						</Attachment>
					</Specimen>
					<Specimen label="CodeBlock — coloration et copie">
						<CodeBlock language="tsx" className="w-full">
							{`export function Tag({ name }: { name: string }) {
  return <span className="rounded-md">{name}</span>;
}`}
						</CodeBlock>
					</Specimen>
					<Specimen label="InputGroup">
						<InputGroup className="w-full max-w-md">
							<InputGroupAddon>
								<InputGroupText>
									<SearchIcon />
								</InputGroupText>
							</InputGroupAddon>
							<InputGroupInput placeholder="Rechercher une question" />
							<InputGroupAddon align="inline-end">
								<InputGroupButton>Chercher</InputGroupButton>
							</InputGroupAddon>
						</InputGroup>
					</Specimen>
					<Specimen label="DropdownMenu">
						<DropdownMenu>
							<DropdownMenuTrigger render={<Button variant="outline" />}>
								Mon compte
							</DropdownMenuTrigger>
							<DropdownMenuContent className="bg-card">
								<DropdownMenuGroup>
									<DropdownMenuLabel>Compte</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuItem>Profil</DropdownMenuItem>
									<DropdownMenuItem variant="destructive">
										Se déconnecter
									</DropdownMenuItem>
								</DropdownMenuGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					</Specimen>
					<Specimen label="Empty">
						<Empty className="w-full max-w-md">
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<FileTextIcon />
								</EmptyMedia>
								<EmptyTitle>Aucune question</EmptyTitle>
								<EmptyDescription>
									Suivez des tags pour voir du contenu ici.
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>
								<Button size="sm">Suivre un tag</Button>
							</EmptyContent>
						</Empty>
					</Specimen>
					<Specimen label="SegmentedControl">
						<SegmentedControl
							options={TABS}
							value={tab}
							onValueChange={setTab}
						/>
					</Specimen>
					<Specimen label="FollowedTags">
						<FollowedTags
							className="w-full"
							tags={["mobile-money", "nodejs", "ussd", "docker"]}
							highlighted={["mobile-money", "nodejs"]}
							addAction={
								<span className="shrink-0 rounded-full border border-dashed px-3 py-1 text-muted-foreground text-sm">
									+ suivre
								</span>
							}
						/>
					</Specimen>
					<Specimen label="QuestionCard">
						<div className="grid w-full gap-4 md:grid-cols-2">
							<QuestionCard {...SAMPLE_QUESTIONS[0]!} />
							<QuestionCard {...SAMPLE_QUESTIONS[1]!} />
						</div>
					</Specimen>
					<Specimen label="CadevBanner">
						<CadevBanner
							className="w-full"
							name="Hackathon CADEV 2026"
							summary="Concours de développement ouvert aux équipes africaines."
							daysLeft={15}
							action={
								<span className="rounded-full bg-background px-4 py-2 font-semibold text-primary text-sm">
									Voir les règles →
								</span>
							}
						/>
					</Specimen>
				</Section>

				<Section title="Organismes">
					<Specimen label="QuestionFeed">
						<QuestionFeed className="w-full" questions={SAMPLE_QUESTIONS} />
					</Specimen>
					<Specimen label="Message (MessageGroup)">
						<MessageGroup className="w-full max-w-md">
							<Message>
								<MessageAvatar>AW</MessageAvatar>
								<MessageContent>
									<MessageHeader>awa_dev</MessageHeader>
									<Bubble variant="muted">
										<BubbleContent>
											Quelqu&apos;un a testé le callback en local ?
										</BubbleContent>
									</Bubble>
									<MessageFooter>il y a 2 h</MessageFooter>
								</MessageContent>
							</Message>
							<Message align="end">
								<MessageAvatar>AD</MessageAvatar>
								<MessageContent>
									<Bubble>
										<BubbleContent>Oui, avec un tunnel ngrok.</BubbleContent>
									</Bubble>
								</MessageContent>
							</Message>
						</MessageGroup>
					</Specimen>
					<Specimen label="MessageScroller">
						<div className="h-48 w-full max-w-md">
							<MessageScrollerProvider>
								<MessageScroller>
									<MessageScrollerViewport>
										<MessageScrollerContent>
											{Array.from({ length: 8 }, (_, i) => (
												<MessageScrollerItem key={i} className="p-2 text-sm">
													Message {i + 1}
												</MessageScrollerItem>
											))}
										</MessageScrollerContent>
									</MessageScrollerViewport>
								</MessageScroller>
							</MessageScrollerProvider>
						</div>
					</Specimen>
					<Specimen label="AppHeader">
						<div className="w-full overflow-hidden rounded-md">
							<AppHeader
								className="static!"
								tabs={TABS}
								activeTab={tab}
								onTabChange={setTab}
								actions={<Button size="sm">+ Question</Button>}
							/>
						</div>
					</Specimen>
					<Specimen label="Empty — état hors-ligne">
						<Empty className="w-full max-w-md">
							<EmptyHeader>
								<EmptyTitle>Hors-ligne</EmptyTitle>
								<EmptyDescription>
									Vos brouillons sont conservés localement.
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					</Specimen>
				</Section>
			</main>
		</div>
	);
}
