import { act, cleanup, renderHook } from "@testing-library/react";
import type { MouseEvent, RefObject } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ViewerStore } from "../use-viewer-store";
import { useImageZoom } from "./use-image-zoom";

describe("useImageZoom", () => {
	const dispatch = vi.fn();
	// Covers the viewport from 0, 0 to 500, 100, so its center is 250, 50.
	let element: HTMLElement;

	beforeEach(() => {
		element = document.createElement("div");

		vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
			height: 100,
			left: 0,
			top: 0,
			width: 500,
		} as DOMRect);
	});

	// Vitest globals are off, so Testing Library can't register this itself.
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	const renderZoom = (
		containerRef: RefObject<HTMLElement | null> = { current: element },
	) => {
		const store = { dispatch } as unknown as ViewerStore;

		return renderHook(() => useImageZoom({ containerRef, store }));
	};

	const wheel = (init: WheelEventInit): WheelEvent => {
		const e = new WheelEvent("wheel", { cancelable: true, ...init });

		act(() => {
			element.dispatchEvent(e);
		});

		return e;
	};

	const getFactor = () => dispatch.mock.calls[0]?.[0].payload.factor;

	describe("click", () => {
		it("toggles the zoom at the point relative to the container center", () => {
			const { result } = renderZoom();

			act(() =>
				result.current.onClick?.({
					clientX: 290,
					clientY: 60,
				} as MouseEvent<HTMLImageElement>),
			);

			expect(dispatch).toHaveBeenCalledExactlyOnceWith({
				payload: { x: 40, y: 10 },
				type: "TOGGLE_ZOOM",
			});
		});

		it("does nothing without a container element", () => {
			const { result } = renderZoom({ current: null });

			act(() =>
				result.current.onClick?.({
					clientX: 290,
					clientY: 60,
				} as MouseEvent<HTMLImageElement>),
			);

			expect(dispatch).not.toHaveBeenCalled();
		});
	});

	describe("wheel", () => {
		it("zooms at the cursor relative to the container center", () => {
			renderZoom();

			wheel({ clientX: 290, clientY: 60, deltaY: -100 });

			expect(dispatch).toHaveBeenCalledExactlyOnceWith({
				payload: { factor: expect.any(Number), point: { x: 40, y: 10 } },
				type: "ZOOM",
			});
		});

		it("zooms in by about 10% per notch when scrolled up", () => {
			renderZoom();

			wheel({ deltaY: -100 });

			expect(getFactor()).toBeCloseTo(Math.exp(0.1));
		});

		it("zooms out when scrolled down", () => {
			renderZoom();

			wheel({ deltaY: 100 });

			expect(getFactor()).toBeCloseTo(Math.exp(-0.1));
		});

		it("returns to the same scale when scrolled back", () => {
			renderZoom();

			wheel({ deltaY: -37 });
			wheel({ deltaY: 37 });

			const [zoomIn, zoomOut] = dispatch.mock.calls.map(
				([action]) => action.payload.factor,
			);

			expect(zoomIn * zoomOut).toBeCloseTo(1);
		});

		it("adds up small steps of a trackpad like one step of a wheel", () => {
			renderZoom();

			for (let i = 0; i < 20; i += 1) wheel({ deltaY: -5 });

			const total = dispatch.mock.calls.reduce(
				(product, [action]) => product * action.payload.factor,
				1,
			);

			expect(total).toBeCloseTo(Math.exp(0.1));
		});

		it("prevents scrolling the page", () => {
			renderZoom();

			expect(wheel({ deltaY: -100 }).defaultPrevented).toBe(true);
		});

		it("does nothing on a pinch, but keeps the page from zooming", () => {
			renderZoom();

			const e = wheel({ ctrlKey: true, deltaY: -10 });

			expect(e.defaultPrevented).toBe(true);
			expect(dispatch).not.toHaveBeenCalled();
		});

		it("does nothing on a horizontal scroll", () => {
			renderZoom();

			const e = wheel({ deltaX: 30, deltaY: 0 });

			expect(e.defaultPrevented).toBe(true);
			expect(dispatch).not.toHaveBeenCalled();
		});

		it("stops listening on unmount", () => {
			const { unmount } = renderZoom();

			unmount();

			expect(wheel({ deltaY: -100 }).defaultPrevented).toBe(false);
			expect(dispatch).not.toHaveBeenCalled();
		});
	});
});
