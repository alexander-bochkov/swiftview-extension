import { act, cleanup, renderHook } from "@testing-library/react";
import type { SyntheticEvent } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ViewerStore } from "../use-viewer-store";
import { useImage } from "./use-image";

describe("useImage", () => {
	const dispatch = vi.fn();

	// Vitest globals are off, so Testing Library can't register this itself.
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	const renderImage = (state: Partial<ViewerStore["state"]> = {}) => {
		const store: ViewerStore = {
			dispatch,
			state: {
				containerSize: { height: 100, width: 500 },
				flip: { x: 1, y: 1 },
				hasImageError: false,
				naturalSize: { height: 200, width: 400 },
				offset: { x: 0, y: 0 },
				rotation: 0,
				rotationStep: null,
				scale: 1,
				...state,
			},
		};

		const containerRef = { current: document.createElement("div") };

		return renderHook(() => useImage({ containerRef, store })).result;
	};

	it("reports an image that fails to load", () => {
		const result = renderImage();

		act(() => {
			result.current.onError?.({} as SyntheticEvent<HTMLImageElement>);
		});

		expect(dispatch).toHaveBeenCalledExactlyOnceWith({ type: "FAIL" });
	});

	it("reports the natural size of the loaded image", () => {
		const result = renderImage();

		act(() => {
			result.current.onLoad?.({
				currentTarget: { naturalHeight: 200, naturalWidth: 400 },
			} as unknown as SyntheticEvent<HTMLImageElement>);
		});

		expect(dispatch).toHaveBeenCalledExactlyOnceWith({
			payload: { height: 200, width: 400 },
			type: "LOAD",
		});
	});

	it("sizes the layout box to the natural size", () => {
		const result = renderImage();

		expect(result.current.style).toMatchObject({ height: 200, width: 400 });
	});

	it("centers the image from the top left corner of the container", () => {
		// The image of 400x200 in the container of 500x100.
		const result = renderImage();

		expect(result.current.style?.transform).toBe(
			"translate(50px, -50px) scale(1, 1) rotate(0deg)",
		);
	});

	it("applies the offset, the scale, the flips and the rotation", () => {
		const result = renderImage({
			flip: { x: -1, y: 1 },
			offset: { x: 10, y: -20 },
			rotation: 90,
			scale: 0.5,
		});

		// Turned and scaled to 100x200, offset by 10, -20: the top left corner is
		// at 210, -70, which the layout box at 400x200 reaches by 60, -70.
		expect(result.current.style?.transform).toBe(
			"translate(60px, -70px) scale(-0.5, 0.5) rotate(90deg)",
		);
	});

	it("hides the image until both sizes are known", () => {
		const result = renderImage({ naturalSize: null });

		expect(result.current.style?.display).toBe("none");
	});

	it("shows the image once both sizes are known", () => {
		const result = renderImage();

		expect(result.current.style?.display).toBeUndefined();
	});

	it("returns the handlers of the drag and the zoom", () => {
		const result = renderImage();

		expect(result.current).toMatchObject({
			onClick: expect.any(Function),
			onClickCapture: expect.any(Function),
			onLostPointerCapture: expect.any(Function),
			onPointerDown: expect.any(Function),
			onPointerMove: expect.any(Function),
			onPointerUp: expect.any(Function),
		});
	});
});
