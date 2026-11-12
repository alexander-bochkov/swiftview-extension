import { describe, expect, it } from "vitest";
import { isMediaType } from "./is-media-type";

describe("isMediaType", () => {
	it.each(["image", "video"])("accepts %s", (value) => {
		expect(isMediaType(value)).toBe(true);
	});

	it.each(["audio", "IMAGE", "", 1, null, undefined, {}])(
		"rejects %s",
		(value) => {
			expect(isMediaType(value)).toBe(false);
		},
	);
});
