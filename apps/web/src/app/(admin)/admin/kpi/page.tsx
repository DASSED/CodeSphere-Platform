"use client";

import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@codesphere/ui/components/molecules/alert";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@codesphere/ui/components/molecules/tabs";
import { KpiGrid } from "@codesphere/ui/components/organisms/kpi-grid";
import { InfoIcon } from "lucide-react";

import AdminFrame from "@/components/admin-frame";

// SAMPLE DATA. No metrics API exists yet; the values only exercise the components.
const PERIODS = {
	"7j": [
		{
			id: "members",
			label: "Membres actifs",
			value: "428",
			delta: 12.4,
			hint: "vs 7 jours précédents",
			trend: [310, 322, 340, 365, 380, 402, 428],
		},
		{
			id: "questions",
			label: "Questions posées",
			value: "193",
			delta: 8.1,
			hint: "vs 7 jours précédents",
			trend: [20, 24, 31, 26, 29, 33, 30],
		},
		{
			id: "answer-rate",
			label: "Questions avec réponse",
			value: "74 %",
			delta: 3.2,
			hint: "vs 7 jours précédents",
			trend: [66, 68, 70, 71, 72, 73, 74],
		},
		{
			id: "first-answer",
			label: "Délai médian de première réponse",
			value: "2 h 10",
			delta: -9.5,
			lowerIsBetter: true,
			hint: "vs 7 jours précédents",
			trend: [190, 180, 175, 160, 150, 140, 130],
		},
		{
			id: "unanswered",
			label: "Questions sans réponse",
			value: "51",
			delta: 6.3,
			lowerIsBetter: true,
			hint: "vs 7 jours précédents",
			trend: [40, 42, 44, 47, 46, 49, 51],
		},
		{
			id: "accepted",
			label: "Réponses acceptées",
			value: "58 %",
			delta: 1.4,
			hint: "vs 7 jours précédents",
			trend: [54, 55, 55, 56, 57, 57, 58],
		},
		{
			id: "agents",
			label: "Contenu d'agents",
			value: "17 %",
			delta: 22.0,
			hint: "vs 7 jours précédents",
			trend: [9, 10, 12, 13, 14, 16, 17],
		},
		{
			id: "offline",
			label: "Envois hors ligne synchronisés",
			value: "312",
			delta: 15.7,
			hint: "vs 7 jours précédents",
			trend: [180, 205, 220, 260, 270, 290, 312],
		},
	],
	"30j": [
		{
			id: "members",
			label: "Membres actifs",
			value: "1 240",
			delta: 31.0,
			hint: "vs 30 jours précédents",
			trend: [700, 790, 880, 960, 1050, 1150, 1240],
		},
		{
			id: "questions",
			label: "Questions posées",
			value: "812",
			delta: 18.5,
			hint: "vs 30 jours précédents",
			trend: [90, 105, 120, 118, 130, 138, 146],
		},
		{
			id: "answer-rate",
			label: "Questions avec réponse",
			value: "71 %",
			delta: 2.0,
			hint: "vs 30 jours précédents",
			trend: [64, 66, 67, 69, 70, 70, 71],
		},
		{
			id: "first-answer",
			label: "Délai médian de première réponse",
			value: "2 h 40",
			delta: -4.2,
			lowerIsBetter: true,
			hint: "vs 30 jours précédents",
			trend: [210, 200, 190, 185, 175, 170, 160],
		},
		{
			id: "unanswered",
			label: "Questions sans réponse",
			value: "236",
			delta: -3.1,
			lowerIsBetter: true,
			hint: "vs 30 jours précédents",
			trend: [60, 58, 57, 55, 54, 52, 50],
		},
		{
			id: "accepted",
			label: "Réponses acceptées",
			value: "55 %",
			delta: 2.2,
			hint: "vs 30 jours précédents",
			trend: [49, 50, 51, 52, 53, 54, 55],
		},
		{
			id: "agents",
			label: "Contenu d'agents",
			value: "14 %",
			delta: 40.0,
			hint: "vs 30 jours précédents",
			trend: [6, 8, 9, 10, 12, 13, 14],
		},
		{
			id: "offline",
			label: "Envois hors ligne synchronisés",
			value: "1 108",
			delta: 28.4,
			hint: "vs 30 jours précédents",
			trend: [400, 520, 610, 720, 860, 980, 1108],
		},
	],
} as const;

export default function KpiPage() {
	return (
		<AdminFrame title="KPI" description="Activité et santé de la communauté.">
			<Alert variant="info">
				<InfoIcon />
				<AlertTitle>Données d'exemple</AlertTitle>
				<AlertDescription>
					Aucune API de métriques n'est branchée : les valeurs servent à valider
					les composants.
				</AlertDescription>
			</Alert>
			<Tabs defaultValue="7j">
				<TabsList>
					<TabsTrigger value="7j">7 jours</TabsTrigger>
					<TabsTrigger value="30j">30 jours</TabsTrigger>
				</TabsList>
				{(Object.keys(PERIODS) as (keyof typeof PERIODS)[]).map((period) => (
					<TabsContent key={period} value={period}>
						<KpiGrid items={PERIODS[period].map((item) => ({ ...item }))} />
					</TabsContent>
				))}
			</Tabs>
		</AdminFrame>
	);
}
