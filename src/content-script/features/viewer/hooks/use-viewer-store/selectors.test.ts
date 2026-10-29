import { describe, expect, it } from "vitest";
import { selectImageTranslate, selectIsReady } from "./selectors";
import type { ViewerState } from "./types";

// An image of 400x200 in a container of 500x100 fits at 50%.
const createState = (state: Partial<ViewerState> = {}): ViewerState => ({
	containerSize: { height: 100, width: 500 },
	flip: { x: 1, y: 1 },
	hasImageError: false,
	naturalSize: { height: 200, width: 400 },
	offset: { x: 0, y: 0 },
	rotation: 0,
	rotationStep: null,
	scale: 0.5,
	...state,
});

describe("selectIsReady", () => {
	it("is ready once both sizes are known", () => {
		expect(selectIsReady(createState())).toBe(true);
	});

	it.each<[string, Partial<ViewerState>]>([
		["the container size", { containerSize: null }],
		["the image size", { naturalSize: null }],
		["both sizes", { containerSize: null, naturalSize: null }],
	])("is not ready without %s", (_, state) => {
		expect(selectIsReady(createState(state))).toBe(false);
	});
});

describe("selectImageTranslate", () => {
	// The layout box of the image is at 0, 0 in the natural size of 400x200,
	// and the transform scales and turns it around its center.
	const getVisibleEdges = (
		state: ViewerState,
		displayed: { height: number; width: number },
	) => {
		const { x, y } = selectImageTranslate(state);

		return {
			bottom: y + 100 + displayed.height / 2,
			left: x + 200 - displayed.width / 2,
			top: y + 100 - displayed.height / 2,
		};
	};

	it("does not move the image before the sizes are known", () => {
		expect(selectImageTranslate(createState({ naturalSize: null }))).toEqual({
			x: 0,
			y: 0,
		});
	});

	it("centers the fitted image", () => {
		// Displayed at 200x100, so its top left corner is at 150, 0.
		expect(selectImageTranslate(createState())).toEqual({ x: 50, y: -50 });
	});

	it("applies the offset", () => {
		expect(
			selectImageTranslate(createState({ offset: { x: 0, y: -30 }, scale: 1 })),
		).toEqual({ x: 50, y: -80 });
	});

	it("centers a rotated image by its rotated size", () => {
		// Turned a quarter and displayed at 50x100, so its top left corner is
		// at 225, 0.
		expect(
			selectImageTranslate(createState({ rotation: 90, scale: 0.25 })),
		).toEqual({ x: 50, y: -50 });
	});

	it("rounds the visible edges in a container of an odd size", () => {
		// Centered, the natural image would start at 50.5, -49.5.
		const state = createState({
			containerSize: { height: 101, width: 501 },
			scale: 1,
		});

		expect(getVisibleEdges(state, { height: 200, width: 400 })).toMatchObject({
			left: 51,
			top: -49,
		});
	});

	it("keeps the far edge of a larger image at the border", () => {
		// Displayed 200.6 px high and moved to the top limit, the image starts at
		// -100.6. Rounded, it would end 0.4 px above the bottom border.
		const state = createState({ offset: { x: 0, y: -50.3 }, scale: 1.003 });
		const displayed = { height: 200 * 1.003, width: 400 * 1.003 };

		expect(getVisibleEdges(state, displayed).bottom).toBeCloseTo(100);
	});
});
