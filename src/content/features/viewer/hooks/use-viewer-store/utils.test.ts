import { describe, expect, it } from "vitest";
import {
	clampOffset,
	getFitScale,
	getOffsetLimit,
	getRotatedSize,
	getToggledScale,
	normalizeSize,
	scaleSize,
	zoomOffset,
} from "./utils";

// A container of 500x100. The large image doesn't fit by its height, the
// small one fits by both axes.
const CONTAINER = { height: 100, width: 500 };
const LARGE = { height: 200, width: 400 };
const SMALL = { height: 50, width: 100 };

describe("clampOffset", () => {
	it("keeps an offset within the edges", () => {
		expect(
			clampOffset({ x: 0, y: -30 }, { height: 200, width: 400 }, CONTAINER),
		).toEqual({ x: 0, y: -30 });
	});

	it("stops the edges at the borders of the container", () => {
		expect(
			clampOffset({ x: 0, y: 300 }, { height: 200, width: 400 }, CONTAINER),
		).toEqual({ x: 0, y: 50 });

		expect(
			clampOffset({ x: 0, y: -300 }, { height: 200, width: 400 }, CONTAINER),
		).toEqual({ x: 0, y: -50 });
	});

	it("centers an axis on which the content is smaller", () => {
		expect(
			clampOffset({ x: 30, y: 0 }, { height: 200, width: 400 }, CONTAINER),
		).toEqual({ x: 0, y: 0 });
	});
});

describe("getOffsetLimit", () => {
	it("is half of the overflow on each axis", () => {
		expect(getOffsetLimit({ height: 300, width: 900 }, CONTAINER)).toEqual({
			x: 200,
			y: 100,
		});
	});

	it("is 0 on an axis on which the content fits", () => {
		expect(getOffsetLimit(LARGE, CONTAINER)).toEqual({ x: 0, y: 50 });
	});
});

describe("getFitScale", () => {
	it("is limited by the axis that fits worse", () => {
		expect(getFitScale(LARGE, CONTAINER)).toBe(0.5);
	});

	it("never enlarges the content by default", () => {
		expect(getFitScale(SMALL, CONTAINER)).toBe(1);
	});

	it("enlarges the content up to the given scale", () => {
		expect(getFitScale(SMALL, CONTAINER, 4)).toBe(2);
		expect(getFitScale(SMALL, CONTAINER, 1.5)).toBe(1.5);
	});
});

describe("getToggledScale", () => {
	describe("large image", () => {
		it("zooms a fitted image to the natural size", () => {
			expect(getToggledScale(0.5, LARGE, CONTAINER)).toBe(1);
		});

		it("fits an image in the natural size", () => {
			expect(getToggledScale(1, LARGE, CONTAINER)).toBe(0.5);
		});

		it("returns to the natural size from a larger zoom", () => {
			expect(getToggledScale(2, LARGE, CONTAINER)).toBe(1);
		});

		it("fits an image zoomed below the natural size", () => {
			expect(getToggledScale(0.7, LARGE, CONTAINER)).toBe(0.5);
		});
	});

	describe("small image", () => {
		it("fills the container from the natural size", () => {
			expect(getToggledScale(1, SMALL, CONTAINER)).toBe(2);
		});

		it("fills the container up to 400%", () => {
			const tiny = { height: 10, width: 20 };

			expect(getToggledScale(1, tiny, CONTAINER)).toBe(4);
		});

		it("returns to the natural size from a zoom", () => {
			expect(getToggledScale(2, SMALL, CONTAINER)).toBe(1);
		});
	});
});

describe("getRotatedSize", () => {
	it.each([0, 180, -180, 360])("keeps the size at %i°", (rotation) => {
		expect(getRotatedSize(LARGE, rotation)).toEqual(LARGE);
	});

	it.each([90, -90, 270, 450])("swaps the axes at %i°", (rotation) => {
		expect(getRotatedSize(LARGE, rotation)).toEqual({
			height: 400,
			width: 200,
		});
	});
});

describe("scaleSize", () => {
	it("scales both axes", () => {
		expect(scaleSize(LARGE, 0.5)).toEqual({ height: 100, width: 200 });
	});
});

describe("normalizeSize", () => {
	it("keeps a size with an area", () => {
		expect(normalizeSize(LARGE)).toBe(LARGE);
	});

	it.each([
		["width", { height: 100, width: 0 }],
		["height", { height: 0, width: 500 }],
		["both sides", { height: 0, width: 0 }],
	])("drops a size without a %s", (_, size) => {
		expect(normalizeSize(size)).toBeNull();
	});
});

describe("zoomOffset", () => {
	it("keeps the point under the cursor in place", () => {
		// The point 40, 10 from the center of the image moves to 80, 20 at
		// twice the scale, so the image shifts by -40, -10.
		expect(zoomOffset({ x: 0, y: 0 }, { x: 40, y: 10 }, 2)).toEqual({
			x: -40,
			y: -10,
		});
	});

	it("takes the current offset into account", () => {
		// The point is 30, 0 from the center of the image, moved by 10, 0.
		expect(zoomOffset({ x: 10, y: 0 }, { x: 40, y: 0 }, 0.5)).toEqual({
			x: 25,
			y: 0,
		});
	});

	it("keeps the offset when the scale doesn't change", () => {
		expect(zoomOffset({ x: 10, y: -20 }, { x: 40, y: 10 }, 1)).toEqual({
			x: 10,
			y: -20,
		});
	});
});
