import { describe, expect, it } from "vitest";
import type { ViewerState } from "../types";
import { reducer } from "./reducer";

// An image of 400x200 in a container of 500x100 fits at 50%, limited by its
// height. At 100% it's larger on the y axis only and moves up to 50 px.
const createState = (
	image: Partial<ViewerState["image"]> = {},
	container: Partial<ViewerState["container"]> = {},
): ViewerState => ({
	container: { height: 100, width: 500, ...container },
	image: {
		flipX: 1,
		flipY: 1,
		naturalHeight: 200,
		naturalWidth: 400,
		offsetX: 0,
		offsetY: 0,
		rotation: 0,
		scale: 0.5,
		...image,
	},
});

// Neither the image nor the container size is known yet.
const EMPTY_STATE = createState(
	{ naturalHeight: null, naturalWidth: null, scale: 1 },
	{ height: null, width: null },
);

// An image of 100x50 fits in its natural size, and fills the container at
// 200%, limited by its height.
const SMALL_IMAGE = { naturalHeight: 50, naturalWidth: 100, scale: 1 };

describe("reducer", () => {
	describe("FLIP", () => {
		it("mirrors the image horizontally", () => {
			const state = reducer(createState(), {
				payload: "horizontal",
				type: "FLIP",
			});

			expect(state.image).toMatchObject({ flipX: -1, flipY: 1 });
		});

		it("mirrors the image vertically", () => {
			const state = reducer(createState(), {
				payload: "vertical",
				type: "FLIP",
			});

			expect(state.image).toMatchObject({ flipX: 1, flipY: -1 });
		});

		it("restores the image on a repeated flip", () => {
			const state = reducer(createState({ flipX: -1 }), {
				payload: "horizontal",
				type: "FLIP",
			});

			expect(state.image.flipX).toBe(1);
		});

		it("fits the image again", () => {
			const state = reducer(createState({ offsetY: -30, scale: 1 }), {
				payload: "horizontal",
				type: "FLIP",
			});

			expect(state.image).toMatchObject({ offsetX: 0, offsetY: 0, scale: 0.5 });
		});

		it("does nothing before the sizes are known", () => {
			expect(
				reducer(EMPTY_STATE, { payload: "horizontal", type: "FLIP" }),
			).toBe(EMPTY_STATE);
		});
	});

	describe("LOAD", () => {
		it("stores the natural size and fits the image", () => {
			const state = reducer(
				createState({ naturalHeight: null, naturalWidth: null }),
				{
					payload: { height: 200, width: 400 },
					type: "LOAD",
				},
			);

			expect(state.image).toMatchObject({
				naturalHeight: 200,
				naturalWidth: 400,
				scale: 0.5,
			});
		});

		it("keeps an image that fits in its natural size", () => {
			const state = reducer(
				createState({ naturalHeight: null, naturalWidth: null }),
				{
					payload: { height: 50, width: 100 },
					type: "LOAD",
				},
			);

			expect(state.image.scale).toBe(1);
		});

		it("only stores the size before the container size is known", () => {
			const state = reducer(EMPTY_STATE, {
				payload: { height: 200, width: 400 },
				type: "LOAD",
			});

			expect(state.image).toMatchObject({
				naturalHeight: 200,
				naturalWidth: 400,
				scale: 1,
			});
		});
	});

	describe("MOVE_TO", () => {
		it("moves a zoomed image along the axis on which it's larger", () => {
			const state = reducer(createState({ scale: 1 }), {
				payload: { x: 10, y: -30 },
				type: "MOVE_TO",
			});

			expect(state.image).toMatchObject({ offsetX: 0, offsetY: -30 });
		});

		it("stops the edges at the borders", () => {
			const state = reducer(createState({ scale: 1 }), {
				payload: { x: 0, y: -300 },
				type: "MOVE_TO",
			});

			expect(state.image.offsetY).toBe(-50);
		});

		it("keeps the state when the image doesn't move", () => {
			const fitted = createState();

			expect(
				reducer(fitted, { payload: { x: 10, y: -30 }, type: "MOVE_TO" }),
			).toBe(fitted);
		});

		it("does nothing before the sizes are known", () => {
			expect(
				reducer(EMPTY_STATE, { payload: { x: 10, y: -30 }, type: "MOVE_TO" }),
			).toBe(EMPTY_STATE);
		});
	});

	describe("RESIZE", () => {
		it("stores the container size and fits the image again", () => {
			const state = reducer(createState({ offsetY: -30, scale: 1 }), {
				payload: { height: 50, width: 500 },
				type: "RESIZE",
			});

			expect(state.container).toEqual({ height: 50, width: 500 });
			expect(state.image).toMatchObject({
				offsetX: 0,
				offsetY: 0,
				scale: 0.25,
			});
		});

		it("only stores the size before the image is loaded", () => {
			const state = reducer(EMPTY_STATE, {
				payload: { height: 100, width: 500 },
				type: "RESIZE",
			});

			expect(state.container).toEqual({ height: 100, width: 500 });
			expect(state.image).toEqual(EMPTY_STATE.image);
		});
	});

	describe("ROTATE", () => {
		it("turns the image right by a quarter", () => {
			const state = reducer(createState(), {
				payload: "right",
				type: "ROTATE",
			});

			expect(state.image.rotation).toBe(90);
		});

		it("turns the image left by a quarter", () => {
			const state = reducer(createState(), { payload: "left", type: "ROTATE" });

			expect(state.image.rotation).toBe(-90);
		});

		it("keeps the visual direction when the image is mirrored", () => {
			const state = reducer(createState({ flipX: -1 }), {
				payload: "right",
				type: "ROTATE",
			});

			expect(state.image.rotation).toBe(-90);
		});

		it("turns the image the usual way when both axes are mirrored", () => {
			const state = reducer(createState({ flipX: -1, flipY: -1 }), {
				payload: "right",
				type: "ROTATE",
			});

			expect(state.image.rotation).toBe(90);
		});

		it("fits the image by its rotated size", () => {
			// Turned a quarter, 400x200 is 200x400 on screen: 100 / 400.
			const state = reducer(createState({ offsetY: -30, scale: 1 }), {
				payload: "right",
				type: "ROTATE",
			});

			expect(state.image).toMatchObject({
				offsetX: 0,
				offsetY: 0,
				scale: 0.25,
			});
		});

		it("keeps the natural size", () => {
			const state = reducer(createState(), {
				payload: "right",
				type: "ROTATE",
			});

			expect(state.image).toMatchObject({
				naturalHeight: 200,
				naturalWidth: 400,
			});
		});

		it("fits the image by its natural size again after a half turn", () => {
			const state = reducer(createState({ rotation: 90, scale: 0.25 }), {
				payload: "right",
				type: "ROTATE",
			});

			expect(state.image).toMatchObject({ rotation: 180, scale: 0.5 });
		});

		it("does nothing before the sizes are known", () => {
			expect(reducer(EMPTY_STATE, { payload: "right", type: "ROTATE" })).toBe(
				EMPTY_STATE,
			);
		});
	});

	// Turned a quarter, the image of 400x200 is 200x400 on screen and fits at
	// 25%. At 100% it moves up to 150 px vertically.
	describe("rotated image", () => {
		const ROTATED = { rotation: 90, scale: 0.25 };

		it("fits by the rotated size on LOAD", () => {
			const state = reducer(
				createState({ naturalHeight: null, naturalWidth: null, rotation: 90 }),
				{ payload: { height: 200, width: 400 }, type: "LOAD" },
			);

			expect(state.image.scale).toBe(0.25);
		});

		it("fits by the rotated size on RESIZE", () => {
			const state = reducer(createState(ROTATED), {
				payload: { height: 200, width: 500 },
				type: "RESIZE",
			});

			expect(state.image.scale).toBe(0.5);
		});

		it("fits by the rotated size on FLIP", () => {
			const state = reducer(createState({ rotation: 90, scale: 1 }), {
				payload: "horizontal",
				type: "FLIP",
			});

			expect(state.image.scale).toBe(0.25);
		});

		it("stops the edges by the rotated size on MOVE_TO", () => {
			const state = reducer(createState({ rotation: 90, scale: 1 }), {
				payload: { x: 30, y: -100 },
				type: "MOVE_TO",
			});

			expect(state.image).toMatchObject({ offsetX: 0, offsetY: -100 });
		});

		it("toggles from the rotated fitted size on TOGGLE_ZOOM", () => {
			const state = reducer(createState(ROTATED), {
				payload: { x: 0, y: 0 },
				type: "TOGGLE_ZOOM",
			});

			expect(state.image.scale).toBe(1);
		});

		it("stops at the rotated fitted size on ZOOM", () => {
			const rotated = createState(ROTATED);

			expect(
				reducer(rotated, {
					payload: { factor: 0.5, point: { x: 0, y: 0 } },
					type: "ZOOM",
				}),
			).toBe(rotated);
		});
	});

	describe("TOGGLE_ZOOM", () => {
		it("opens a fitted image in its natural size under the cursor", () => {
			// 40, 10 from the center. At twice the scale that point of the image
			// moves to 80, 20, so the image shifts by -40, -10. The image is
			// narrower than the container, so it stays centered horizontally.
			const state = reducer(createState(), {
				payload: { x: 40, y: 10 },
				type: "TOGGLE_ZOOM",
			});

			expect(state.image).toMatchObject({
				offsetX: 0,
				offsetY: -10,
				scale: 1,
			});
		});

		it("fits and centers an image in its natural size", () => {
			const state = reducer(createState({ offsetY: -30, scale: 1 }), {
				payload: { x: 40, y: 10 },
				type: "TOGGLE_ZOOM",
			});

			expect(state.image).toMatchObject({ offsetX: 0, offsetY: 0, scale: 0.5 });
		});

		it("returns to the natural size from a larger zoom", () => {
			const state = reducer(createState({ offsetY: -100, scale: 2 }), {
				payload: { x: 0, y: 0 },
				type: "TOGGLE_ZOOM",
			});

			// -100 at 200% is -50 at 100%, right at the border.
			expect(state.image).toMatchObject({ offsetY: -50, scale: 1 });
		});

		it("fills the container with a small image", () => {
			const state = reducer(createState(SMALL_IMAGE), {
				payload: { x: 0, y: 0 },
				type: "TOGGLE_ZOOM",
			});

			expect(state.image.scale).toBe(2);
		});

		it("does nothing before the sizes are known", () => {
			expect(
				reducer(EMPTY_STATE, { payload: { x: 0, y: 0 }, type: "TOGGLE_ZOOM" }),
			).toBe(EMPTY_STATE);
		});
	});

	describe("ZOOM", () => {
		it("zooms by the factor under the cursor", () => {
			const state = reducer(createState(), {
				payload: { factor: 2, point: { x: 40, y: 10 } },
				type: "ZOOM",
			});

			expect(state.image).toMatchObject({
				offsetX: 0,
				offsetY: -10,
				scale: 1,
			});
		});

		it("keeps the edges at the borders when zooming out", () => {
			// At 80% the image is 320x160 and moves up to 30 px.
			const state = reducer(createState({ offsetY: -50, scale: 1 }), {
				payload: { factor: 0.8, point: { x: 0, y: 0 } },
				type: "ZOOM",
			});

			expect(state.image).toMatchObject({ offsetY: -30, scale: 0.8 });
		});

		it("stops at the fitted size", () => {
			const state = reducer(createState({ scale: 0.6 }), {
				payload: { factor: 0.5, point: { x: 0, y: 0 } },
				type: "ZOOM",
			});

			expect(state.image.scale).toBe(0.5);
		});

		it("stops at 400%", () => {
			const state = reducer(createState({ scale: 3 }), {
				payload: { factor: 2, point: { x: 0, y: 0 } },
				type: "ZOOM",
			});

			expect(state.image.scale).toBe(4);
		});

		it("doesn't shrink a small image below its natural size", () => {
			const small = createState(SMALL_IMAGE);

			expect(
				reducer(small, {
					payload: { factor: 0.5, point: { x: 0, y: 0 } },
					type: "ZOOM",
				}),
			).toBe(small);
		});

		it.each([
			["the fitted size", 0.5, 0.5],
			["400%", 4, 2],
		])("keeps the state at %s", (_, scale, factor) => {
			const limited = createState({ scale });

			expect(
				reducer(limited, {
					payload: { factor, point: { x: 0, y: 0 } },
					type: "ZOOM",
				}),
			).toBe(limited);
		});

		it("does nothing before the sizes are known", () => {
			expect(
				reducer(EMPTY_STATE, {
					payload: { factor: 2, point: { x: 0, y: 0 } },
					type: "ZOOM",
				}),
			).toBe(EMPTY_STATE);
		});
	});
});
