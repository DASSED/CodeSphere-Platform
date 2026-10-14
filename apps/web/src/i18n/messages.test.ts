/// <reference types="bun" />
import { describe, expect, test } from "bun:test";

import en from "../../messages/en.json";
import fr from "../../messages/fr.json";

type Tree = { [key: string]: string | Tree };

function leaves(tree: Tree, prefix = ""): string[] {
	return Object.entries(tree).flatMap(([key, value]) =>
		typeof value === "string"
			? [`${prefix}${key}`]
			: leaves(value, `${prefix}${key}.`),
	);
}

function valueAt(tree: Tree, key: string): string {
	return key
		.split(".")
		.reduce<string | Tree>(
			(node, part) => (node as Tree)[part] ?? "",
			tree,
		) as string;
}

describe("messages", () => {
	test("French and English have the same keys", () => {
		expect(leaves(en as Tree).sort()).toEqual(leaves(fr as Tree).sort());
	});

	// The app uses no rich text: a `<word>` would be read as an ICU tag and the page would show
	// the raw key instead of the message.
	test("no message carries an ICU tag", () => {
		const tagged = [en, fr].flatMap((messages) =>
			leaves(messages as Tree).filter((key) =>
				/<\/?[\p{L}]/u.test(valueAt(messages as Tree, key)),
			),
		);
		expect(tagged).toEqual([]);
	});
});
