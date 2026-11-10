import { describe, expect, it } from "vitest";
import { findBestImageUrl } from "./find-best-image-url";

describe("findBestImageUrl", () => {
	it("finds no better url of the image yet", () => {
		expect(findBestImageUrl(document.createElement("img"))).toBeNull();
	});
});
