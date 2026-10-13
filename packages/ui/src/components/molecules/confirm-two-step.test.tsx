/// <reference types="bun" />
// #131: ConfirmTwoStep, without a DOM library (no new dependency): the state machine drives
// arming, countdown, cancellation and the keyboard; a server render checks what is shown.
import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { ConfirmTwoStep } from "./confirm-two-step";
import {
	type ConfirmEvent,
	type ConfirmState,
	confirmStep,
	IDLE,
} from "./confirm-two-step-state";

const run = (events: ConfirmEvent[], from: ConfirmState = IDLE) =>
	events.reduce(confirmStep, from);
const armed = run([{ type: "arm", seconds: 5 }]);

describe("ConfirmTwoStep state", () => {
	test("the first press arms it with the full countdown", () => {
		expect(armed).toEqual({ phase: "armed", remaining: 5 });
	});

	test("counts down one second per tick", () => {
		expect(run([{ type: "tick" }, { type: "tick" }], armed)).toEqual({
			phase: "armed",
			remaining: 3,
		});
	});

	test("cancels itself at 0, never confirms", () => {
		const ticks = Array.from({ length: 5 }, () => ({ type: "tick" }) as const);
		expect(run(ticks, armed)).toEqual(IDLE);
	});

	test("the second press confirms", () => {
		expect(confirmStep(armed, { type: "confirm" })).toEqual({
			phase: "confirmed",
		});
	});

	test("« Annuler » disarms", () => {
		expect(confirmStep(armed, { type: "cancel" })).toEqual(IDLE);
	});

	test("Enter on « Confirmer » confirms, Enter on « Annuler » disarms", () => {
		expect(
			confirmStep(armed, { type: "key", key: "Enter", on: "confirm" }),
		).toEqual({ phase: "confirmed" });
		expect(
			confirmStep(armed, { type: "key", key: "Enter", on: "cancel" }),
		).toEqual(IDLE);
	});

	test("Escape disarms from either button", () => {
		expect(
			confirmStep(armed, { type: "key", key: "Escape", on: "confirm" }),
		).toEqual(IDLE);
	});

	test("nothing confirms while idle", () => {
		expect(confirmStep(IDLE, { type: "confirm" })).toEqual(IDLE);
		expect(
			confirmStep(IDLE, { type: "key", key: "Enter", on: "confirm" }),
		).toEqual(IDLE);
	});
});

describe("ConfirmTwoStep render", () => {
	test("idle: one button, with an ellipsis, greyed out when disabled", () => {
		const html = renderToStaticMarkup(
			<ConfirmTwoStep
				label="Suspendre ce Member"
				onConfirm={() => {}}
				disabled
			/>,
		);
		expect(html).toContain("Suspendre ce Member…");
		expect(html).toContain('data-state="idle"');
		expect(html).toContain("disabled");
	});
});
