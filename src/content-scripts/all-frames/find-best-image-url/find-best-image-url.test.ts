import { describe, expect, it } from "vitest";
import { findBestImageUrl } from "./find-best-image-url";

describe("findBestImageUrl", () => {
	it("finds no better url under the point yet", () => {
		expect(findBestImageUrl({ x: 10, y: 20 })).toBeNull();
	});

	it("finds no better url without a point", () => {
		expect(findBestImageUrl(null)).toBeNull();
	});
});
