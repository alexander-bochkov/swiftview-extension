import { describe, expect, it } from "vitest";
import { hasModifierKey } from "./utils";

const NO_KEYS = {
	altKey: false,
	ctrlKey: false,
	metaKey: false,
	shiftKey: false,
};

describe("hasModifierKey", () => {
	it("is false without modifier keys", () => {
		expect(hasModifierKey(NO_KEYS)).toBe(false);
	});

	it.each(["altKey", "ctrlKey", "metaKey", "shiftKey"])(
		"is true with %s",
		(key) => {
			expect(hasModifierKey({ ...NO_KEYS, [key]: true })).toBe(true);
		},
	);
});
