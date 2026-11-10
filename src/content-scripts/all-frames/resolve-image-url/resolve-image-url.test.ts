import { describe, expect, it } from "vitest";
import { resolveImageUrl } from "./resolve-image-url";

describe("resolveImageUrl", () => {
	it("finds no better url under the point yet", () => {
		expect(resolveImageUrl({ x: 10, y: 20 })).toBeNull();
	});

	it("finds no better url without a point", () => {
		expect(resolveImageUrl(null)).toBeNull();
	});
});
