import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useViewerStore, type Zoom } from "./use-viewer-store";

describe("useViewerStore", () => {
	// Vitest globals are off, so Testing Library can't register this itself.
	afterEach(cleanup);

	const ZOOM: Zoom = { offset: { x: 10, y: -20 }, scale: 2 };

	const renderZoomed = () => {
		const rendered = renderHook(() => useViewerStore());

		act(() =>
			rendered.result.current.dispatch({ payload: ZOOM, type: "ZOOM" }),
		);

		return rendered;
	};

	it("starts without flips, rotation and zoom", () => {
		const { result } = renderHook(() => useViewerStore());

		expect(result.current.state).toEqual({
			rotation: 0,
			scaleX: 1,
			scaleY: 1,
			zoom: null,
		});
	});

	describe("ZOOM", () => {
		it("stores the zoom", () => {
			const { result } = renderZoomed();

			expect(result.current.state.zoom).toEqual(ZOOM);
		});
	});

	describe("RESET_ZOOM", () => {
		it("fits the image again", () => {
			const { result } = renderZoomed();

			act(() => result.current.dispatch({ type: "RESET_ZOOM" }));

			expect(result.current.state.zoom).toBeNull();
		});

		it("keeps the store when the image is already fitted", () => {
			const { result } = renderHook(() => useViewerStore());
			const first = result.current;

			act(() => result.current.dispatch({ type: "RESET_ZOOM" }));

			expect(result.current).toBe(first);
		});
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

		it.each(["horizontal", "vertical"] as const)(
			"resets the zoom on a %s flip",
			(payload) => {
				const { result } = renderZoomed();

				act(() => result.current.dispatch({ payload, type: "FLIP" }));

				expect(result.current.state.zoom).toBeNull();
			},
		);
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

		it("resets the zoom", () => {
			const { result } = renderZoomed();

			act(() => result.current.dispatch({ payload: "left", type: "ROTATE" }));

			expect(result.current.state.zoom).toBeNull();
		});
	});

	it("returns the same store while the state does not change", () => {
		const { rerender, result } = renderHook(() => useViewerStore());
		const first = result.current;

		rerender();

		expect(result.current).toBe(first);
	});
});
