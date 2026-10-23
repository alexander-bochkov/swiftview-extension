import { describe, expect, it } from "vitest";
import { selectIsReady } from "./selectors";
import type { ViewerState } from "./types";

describe("selectIsReady", () => {
	const createState = (
		container: number | null,
		image: number | null,
	): ViewerState => ({
		container: { height: container, width: container },
		image: {
			flipX: 1,
			flipY: 1,
			height: image,
			offsetX: 0,
			offsetY: 0,
			rotation: 0,
			scale: 1,
			width: image,
		},
	});

	it("is ready once both sizes are known", () => {
		expect(selectIsReady(createState(100, 200))).toBe(true);
	});

	it.each([
		["the container size", null, 200],
		["the image size", 100, null],
		["both sizes", null, null],
	])("is not ready without %s", (_, container, image) => {
		expect(selectIsReady(createState(container, image))).toBe(false);
	});
});
