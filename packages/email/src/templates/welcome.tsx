import {
	Body,
	Container,
	Head,
	Heading,
	Html,
	Preview,
	Text,
} from "@react-email/components";

export type WelcomeProps = {
	name: string;
};

export const WELCOME_SUBJECT = "Welcome to CodeSphere";

export function Welcome({ name }: WelcomeProps) {
	return (
		<Html lang="en">
			<Head />
			<Preview>Your CodeSphere account is ready</Preview>
			<Body style={{ fontFamily: "sans-serif", backgroundColor: "#ffffff" }}>
				<Container style={{ maxWidth: 480, padding: 24 }}>
					<Heading as="h1">{`Welcome, ${name}`}</Heading>
					<Text>
						Your CodeSphere account is ready. Follow a few Tags to shape your
						For You feed, or ask your first Question.
					</Text>
				</Container>
			</Body>
		</Html>
	);
}
