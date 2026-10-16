"use client";

import { cn } from "@codesphere/ui/lib/utils";
import { useEffect, useState } from "react";

export type QuestionStep = { id: string; label: string };

/**
 * The sections of a Question page as steps to jump to (question, solution, answers, reply). The
 * step whose section is under the top of the viewport is marked `aria-current="location"`.
 */
export function QuestionSteps({
	steps,
	label,
	className,
}: {
	steps: readonly QuestionStep[];
	label: string;
	className?: string;
}) {
	const [active, setActive] = useState(steps[0]?.id);
	const ids = steps.map((step) => step.id).join("|");

	useEffect(() => {
		const nodes = ids
			.split("|")
			.map((id) => document.getElementById(id))
			.filter((node): node is HTMLElement => node !== null);
		if (nodes.length === 0) {
			return;
		}
		const observer = new IntersectionObserver(
			(entries) => {
				const first = entries
					.filter((entry) => entry.isIntersecting)
					.sort(
						(a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
					)[0];
				if (first) {
					setActive(first.target.id);
				}
			},
			// A section counts once it reaches the upper part of the screen, under the header.
			{ rootMargin: "-112px 0px -55% 0px" },
		);
		for (const node of nodes) {
			observer.observe(node);
		}
		return () => observer.disconnect();
	}, [ids]);

	return (
		<nav
			aria-label={label}
			className={cn(
				"sticky top-16 z-10 -mx-1 overflow-x-auto bg-background/90 px-1 py-2 backdrop-blur",
				className,
			)}
		>
			<ol className="flex w-max min-w-full items-center gap-1.5">
				{steps.map((step, index) => (
					<li key={step.id}>
						<a
							href={`#${step.id}`}
							aria-current={active === step.id ? "location" : undefined}
							onClick={(event) => {
								const target = document.getElementById(step.id);
								if (target) {
									event.preventDefault();
									target.scrollIntoView({ behavior: "smooth", block: "start" });
									setActive(step.id);
								}
							}}
							className={cn(
								"inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1 font-medium text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50",
								active === step.id
									? "border-primary bg-primary text-primary-foreground"
									: "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
							)}
						>
							<span aria-hidden className="font-mono text-xs opacity-70">
								{index + 1}
							</span>
							{step.label}
						</a>
					</li>
				))}
			</ol>
		</nav>
	);
}
