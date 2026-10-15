import { describe, expect, it } from "vitest";
import { clampOffset, getFitScale, getVisualSize, zoomAt } from "./layout";

describe("layout", () => {
	describe("getFitScale", () => {
		it("shrinks an image larger than the container by the tighter axis", () => {
			expect(
				getFitScale({ height: 200, width: 400 }, { height: 100, width: 500 }),
			).toBe(0.5);
		});

		it("never enlarges an image", () => {
			expect(
				getFitScale({ height: 50, width: 100 }, { height: 100, width: 500 }),
			).toBe(1);
		});
	});

	describe("getVisualSize", () => {
		it("keeps the size of an upright image", () => {
			expect(getVisualSize({ height: 200, width: 400 }, false)).toEqual({
				height: 200,
				width: 400,
			});
		});

		it("swaps the axes of a sideways image", () => {
			expect(getVisualSize({ height: 200, width: 400 }, true)).toEqual({
				height: 400,
				width: 200,
			});
		});
	});

	describe("clampOffset", () => {
		const container = { height: 100, width: 200 };

		it("keeps an offset that leaves no gap at the borders", () => {
			expect(
				clampOffset({ x: 50, y: -25 }, { height: 200, width: 400 }, container),
			).toEqual({ x: 50, y: -25 });
		});

		it("stops the edges of a larger image at the borders", () => {
			expect(
				clampOffset(
					{ x: 500, y: -500 },
					{ height: 200, width: 400 },
					container,
				),
			).toEqual({ x: 100, y: -50 });
		});

		it("centers an image smaller than the container per axis", () => {
			expect(
				clampOffset({ x: 30, y: -30 }, { height: 50, width: 400 }, container),
			).toEqual({ x: 30, y: 0 });
		});

		it("does not return -0", () => {
			const { y } = clampOffset(
				{ x: 0, y: -30 },
				{ height: 50, width: 50 },
				container,
			);

			expect(Object.is(y, 0)).toBe(true);
		});
	});

	describe("zoomAt", () => {
		// The fitted image fills the container exactly.
		const container = { height: 100, width: 200 };
		const image = { height: 200, width: 400 };
		const fit = { offset: { x: 0, y: 0 }, scale: 0.5 };

		// The point of the image under `point`, in natural px from its center.
		const getImagePoint = (
			point: { x: number; y: number },
			{ offset, scale }: typeof fit,
		) => ({
			x: (point.x - offset.x) / scale,
			y: (point.y - offset.y) / scale,
		});

		it("keeps the point of the image under the cursor", () => {
			const point = { x: 50, y: 25 };

			const zoom = zoomAt({ container, image, point, scale: 1, zoom: fit });

			expect(zoom).toEqual({ offset: { x: -50, y: -25 }, scale: 1 });
			expect(getImagePoint(point, zoom)).toEqual(getImagePoint(point, fit));
		});

		it("keeps the image centered when zooming at the center", () => {
			const zoom = zoomAt({
				container,
				image,
				point: { x: 0, y: 0 },
				scale: 3,
				zoom: fit,
			});

			expect(zoom).toEqual({ offset: { x: 0, y: 0 }, scale: 3 });
		});

		it("sticks the edges to the borders when zooming out", () => {
			const zoomed = { offset: { x: -300, y: -150 }, scale: 2 };

			const zoom = zoomAt({
				container,
				image,
				point: { x: -100, y: -50 },
				scale: 1,
				zoom: zoomed,
			});

			// Unclamped, the offset would be -200, -100.
			expect(zoom).toEqual({ offset: { x: -100, y: -50 }, scale: 1 });
		});
	});
});
