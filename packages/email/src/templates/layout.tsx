/** @jsxImportSource react */
import {
	Body,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Preview,
	Text,
} from "@react-email/components";
import type { CSSProperties, ReactNode } from "react";

import type { Locale } from "../locale";

// Laterite red of the brand palette (packages/ui globals.css). Inline styles only: mail
// clients ignore stylesheets, and no remote image or tracking pixel is ever loaded.
const BRAND = "#a8432a";

const FOOTER: Record<Locale, string> = {
	fr: "Vous recevez ce message parce que vous avez un compte CodeSphere Platform.",
	en: "You receive this message because you have a CodeSphere Platform account.",
};

export const paragraph: CSSProperties = {
	fontSize: 16,
	lineHeight: "24px",
	color: "#2b2118",
};

export function Layout({
	locale,
	preview,
	title,
	children,
}: {
	locale: Locale;
	preview: string;
	title: string;
	children: ReactNode;
}) {
	return (
		<Html lang={locale}>
			<Head />
			<Preview>{preview}</Preview>
			<Body
				style={{
					fontFamily: "Helvetica, Arial, sans-serif",
					backgroundColor: "#faf6f0",
					margin: 0,
					padding: "24px 0",
				}}
			>
				<Container
					style={{
						maxWidth: 520,
						backgroundColor: "#ffffff",
						borderTop: `4px solid ${BRAND}`,
						padding: "24px 32px",
					}}
				>
					<Text
						style={{
							margin: 0,
							fontSize: 14,
							fontWeight: 700,
							letterSpacing: 1,
							color: BRAND,
						}}
					>
						CODESPHERE
					</Text>
					<Heading as="h1" style={{ fontSize: 24, color: "#2b2118" }}>
						{title}
					</Heading>
					{children}
					<Hr style={{ borderColor: "#e8dfd3", margin: "24px 0 12px" }} />
					<Text style={{ fontSize: 12, color: "#7a6b5d", margin: 0 }}>
						{FOOTER[locale]}
					</Text>
				</Container>
			</Body>
		</Html>
	);
}
