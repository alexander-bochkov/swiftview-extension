import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useImageViewerStore } from "./use-image-viewer-store";

describe("useImageViewerStore", () => {
	const NATURAL_SIZE = { height: 200, width: 400 };

	it("starts with the natural size, without the container size, flips, rotation and zoom", () => {
		const { result } = renderHook(() => useImageViewerStore(NATURAL_SIZE));

		expect(result.current.state).toEqual({
			blockingTransition: null,
			containerSize: null,
			flip: { x: 1, y: 1 },
			naturalSize: NATURAL_SIZE,
			offset: { x: 0, y: 0 },
			rotation: 0,
			scale: 1,
		});
	});

	it("applies the dispatched actions", () => {
		const { result } = renderHook(() => useImageViewerStore(NATURAL_SIZE));

		act(() => {
			result.current.dispatch({
				payload: { height: 100, width: 500 },
				type: "RESIZE",
			});
		});

		expect(result.current.state.scale).toBe(0.5);
	});

	it("returns the same store when an action changes nothing", () => {
		const { result } = renderHook(() => useImageViewerStore(NATURAL_SIZE));
		const first = result.current;

		act(() =>
			result.current.dispatch({ payload: { x: 10, y: 10 }, type: "MOVE_BY" }),
		);

		expect(result.current).toBe(first);
	});

	it("returns the same store while the state does not change", () => {
		const { rerender, result } = renderHook(() =>
			useImageViewerStore(NATURAL_SIZE),
		);
		const first = result.current;

		rerender();

		expect(result.current).toBe(first);
	});
});
