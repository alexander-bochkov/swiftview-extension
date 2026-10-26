import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useViewerStore } from "./use-viewer-store";

describe("useViewerStore", () => {
	// Vitest globals are off, so Testing Library can't register this itself.
	afterEach(cleanup);

	it("starts without sizes, flips, rotation and zoom", () => {
		const { result } = renderHook(() => useViewerStore());

		expect(result.current.state).toEqual({
			containerSize: null,
			flip: { x: 1, y: 1 },
			naturalSize: null,
			offset: { x: 0, y: 0 },
			rotation: 0,
			scale: 1,
		});
	});

	it("applies the dispatched actions", () => {
		const { result } = renderHook(() => useViewerStore());

		act(() => {
			result.current.dispatch({
				payload: { height: 200, width: 400 },
				type: "LOAD",
			});
			result.current.dispatch({
				payload: { height: 100, width: 500 },
				type: "RESIZE",
			});
		});

		expect(result.current.state.scale).toBe(0.5);
	});

	it("returns the same store when an action changes nothing", () => {
		const { result } = renderHook(() => useViewerStore());
		const first = result.current;

		act(() =>
			result.current.dispatch({ payload: { x: 10, y: 10 }, type: "MOVE_TO" }),
		);

		expect(result.current).toBe(first);
	});

	it("returns the same store while the state does not change", () => {
		const { rerender, result } = renderHook(() => useViewerStore());
		const first = result.current;

		rerender();

		expect(result.current).toBe(first);
	});
});
