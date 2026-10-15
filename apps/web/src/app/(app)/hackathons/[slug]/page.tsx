import { Skeleton } from "@codesphere/ui/components/atoms/skeleton";
import { Suspense } from "react";

import { HackathonPage } from "@/components/hackathon/hackathon-page";

// A Hackathon in tabs (#45). Rendered in the browser; `?tab=` keeps the open tab in the URL.
export default async function Page({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	return (
		<Suspense
			fallback={
				<main className="mx-auto max-w-5xl px-4 py-8">
					<Skeleton className="h-96 rounded-3xl" />
				</main>
			}
		>
			<HackathonPage slug={slug} />
		</Suspense>
	);
}
