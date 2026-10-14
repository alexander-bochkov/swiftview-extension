import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useViewerStore } from "./use-viewer-store";

describe("useViewerStore", () => {
	// Vitest globals are off, so Testing Library can't register this itself.
	afterEach(cleanup);

	it("starts without flips and rotation", () => {
		const { result } = renderHook(() => useViewerStore());

		expect(result.current.state).toEqual({ rotation: 0, scaleX: 1, scaleY: 1 });
	});

	describe("FLIP", () => {
		it("mirrors the image horizontally", () => {
			const { result } = renderHook(() => useViewerStore());

			act(() =>
				result.current.dispatch({ payload: "horizontal", type: "FLIP" }),
			);

			expect(result.current.state).toMatchObject({ scaleX: -1, scaleY: 1 });
		});

		it("mirrors the image vertically", () => {
			const { result } = renderHook(() => useViewerStore());

			act(() => result.current.dispatch({ payload: "vertical", type: "FLIP" }));

			expect(result.current.state).toMatchObject({ scaleX: 1, scaleY: -1 });
		});

		it("restores the image on a repeated flip", () => {
			const { result } = renderHook(() => useViewerStore());

			act(() => {
				result.current.dispatch({ payload: "horizontal", type: "FLIP" });
				result.current.dispatch({ payload: "horizontal", type: "FLIP" });
			});

			expect(result.current.state.scaleX).toBe(1);
		});
	});

	describe("ROTATE", () => {
		it("turns the image right by a quarter", () => {
			const { result } = renderHook(() => useViewerStore());

			act(() => result.current.dispatch({ payload: "right", type: "ROTATE" }));

			expect(result.current.state.rotation).toBe(90);
		});

		it("turns the image left by a quarter", () => {
			const { result } = renderHook(() => useViewerStore());

			act(() => result.current.dispatch({ payload: "left", type: "ROTATE" }));

			expect(result.current.state.rotation).toBe(-90);
		});

		it("keeps the visual direction when the image is mirrored", () => {
			const { result } = renderHook(() => useViewerStore());

			act(() => {
				result.current.dispatch({ payload: "horizontal", type: "FLIP" });
				result.current.dispatch({ payload: "right", type: "ROTATE" });
			});

			expect(result.current.state.rotation).toBe(-90);
		});

		it("turns the image the usual way when both axes are mirrored", () => {
			const { result } = renderHook(() => useViewerStore());

			act(() => {
				result.current.dispatch({ payload: "horizontal", type: "FLIP" });
				result.current.dispatch({ payload: "vertical", type: "FLIP" });
				result.current.dispatch({ payload: "right", type: "ROTATE" });
			});

			expect(result.current.state.rotation).toBe(90);
		});
	});

	it("returns the same store while the state does not change", () => {
		const { rerender, result } = renderHook(() => useViewerStore());
		const first = result.current;

		rerender();

		expect(result.current).toBe(first);
	});
});
