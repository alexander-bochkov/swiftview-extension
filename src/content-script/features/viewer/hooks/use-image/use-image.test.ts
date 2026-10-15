import { act, cleanup, renderHook } from "@testing-library/react";
import type {
	MouseEvent,
	PointerEvent,
	RefObject,
	SyntheticEvent,
} from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ViewerStore, Zoom } from "../use-viewer-store";
import { useImage } from "./use-image";

type Size = { height: number; width: number };

describe("useImage", () => {
	const disconnect = vi.fn();
	const dispatch = vi.fn();
	const observe = vi.fn();
	// Covers the viewport from 0, 0 to 500, 100, like the setup below.
	let element: HTMLElement;
	let notify: (size: Size) => void;

	beforeEach(() => {
		element = document.createElement("div");

		vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
			height: 100,
			left: 0,
			top: 0,
			width: 500,
		} as DOMRect);

		// jsdom doesn't implement ResizeObserver, so capture the callback and
		// let the tests report the container size themselves.
		vi.stubGlobal(
			"ResizeObserver",
			class {
				constructor(callback: ResizeObserverCallback) {
					notify = (size) =>
						callback(
							[{ contentRect: size } as ResizeObserverEntry],
							this as unknown as ResizeObserver,
						);
				}

				observe = observe;
				disconnect = disconnect;
			},
		);
	});

	// Vitest globals are off, so Testing Library can't register this itself.
	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
		vi.clearAllMocks();
	});

	const renderImage = (
		state: Partial<ViewerStore["state"]> = {},
		container: RefObject<HTMLElement | null> = { current: element },
	) => {
		const store: ViewerStore = {
			dispatch,
			state: { rotation: 0, scaleX: 1, scaleY: 1, zoom: null, ...state },
		};

		return renderHook(() => useImage({ container, store }));
	};

	type Rendered = ReturnType<typeof renderImage>["result"];

	const load = (result: Rendered, { height, width }: Size) => {
		act(() => {
			result.current.onLoad?.({
				currentTarget: { naturalHeight: height, naturalWidth: width },
			} as unknown as SyntheticEvent<HTMLImageElement>);
		});
	};

	// Image of 400x200 in a container of 500x100: the height is the limit.
	const setup = (
		state?: Partial<ViewerStore["state"]>,
		image: Size = { height: 200, width: 400 },
	) => {
		const { result } = renderImage(state);

		load(result, image);
		act(() => notify({ height: 100, width: 500 }));

		return result;
	};

	describe("fit", () => {
		it("does not scale the image until it is loaded", () => {
			const { result } = renderImage();
			act(() => notify({ height: 100, width: 500 }));

			expect(result.current.style?.scale).toBe(1);
		});

		it("does not scale the image until the container size is known", () => {
			const { result } = renderImage();
			load(result, { height: 200, width: 400 });

			expect(result.current.style?.scale).toBe(1);
		});

		it("keeps an image that fits in its natural size", () => {
			const result = setup({}, { height: 50, width: 100 });

			expect(result.current.style?.scale).toBe(1);
		});

		it("shrinks an image that does not fit", () => {
			const result = setup();

			expect(result.current.style?.scale).toBe(0.5);
		});

		it("fits the rotated image by its visual size", () => {
			// Turned a quarter, 400x200 is 200x400 on screen: 100 / 400.
			const result = setup({ rotation: 90 });

			expect(result.current.style?.scale).toBe(0.25);
		});

		it("treats a negative quarter turn as sideways", () => {
			const result = setup({ rotation: -90 });

			expect(result.current.style?.scale).toBe(0.25);
		});

		it("fits the image again when the container is resized", () => {
			const result = setup();

			act(() => notify({ height: 50, width: 500 }));

			expect(result.current.style?.scale).toBe(0.25);
		});
	});

	describe("transform", () => {
		it("does not transform the image in the initial state", () => {
			const { result } = renderImage();

			expect(result.current.style?.transform).toBe("scale(1, 1) rotate(0deg)");
		});

		it("applies the flips and the rotation of the store", () => {
			const { result } = renderImage({ rotation: 270, scaleX: -1 });

			expect(result.current.style?.transform).toBe(
				"scale(-1, 1) rotate(270deg)",
			);
		});

		it("does not mix the fit into the transform", () => {
			const result = setup({ scaleX: -1 });

			expect(result.current.style?.transform).toBe("scale(-1, 1) rotate(0deg)");
		});
	});

	describe("zoom", () => {
		const ZOOM: Zoom = { offset: { x: 10, y: -20 }, scale: 2 };

		const click = (result: Rendered, clientX: number, clientY: number) => {
			act(() => {
				result.current.onClick?.({
					clientX,
					clientY,
				} as MouseEvent<HTMLImageElement>);
			});
		};

		const wheel = (init: WheelEventInit): WheelEvent => {
			const e = new WheelEvent("wheel", {
				cancelable: true,
				deltaMode: WheelEvent.DOM_DELTA_LINE,
				...init,
			});

			act(() => {
				element.dispatchEvent(e);
			});

			return e;
		};

		const getZoomActions = () =>
			dispatch.mock.calls.filter(([action]) => action.type === "ZOOM");

		it("applies the scale and the offset of the zoom", () => {
			const result = setup({ zoom: ZOOM });

			expect(result.current.style).toMatchObject({
				scale: 2,
				translate: "10px -20px",
			});
		});

		it("does not offset the fitted image", () => {
			const result = setup();

			expect(result.current.style?.translate).toBe("0px 0px");
		});

		it("resets the zoom when the container is resized", () => {
			setup();
			dispatch.mockClear();

			act(() => notify({ height: 50, width: 500 }));

			expect(dispatch).toHaveBeenCalledExactlyOnceWith({ type: "RESET_ZOOM" });
		});

		describe("click", () => {
			it("opens a shrunk image in its natural size under the cursor", () => {
				const result = setup();

				// 40, 10 from the center. At twice the scale that point of the
				// image moves to 80, 20, so the image shifts by -40, -10. The image
				// is narrower than the container, so it stays centered horizontally.
				click(result, 290, 60);

				expect(dispatch).toHaveBeenCalledWith({
					payload: { offset: { x: 0, y: -10 }, scale: 1 },
					type: "ZOOM",
				});
			});

			it("fits a zoomed image again", () => {
				const result = setup({ zoom: ZOOM });

				click(result, 290, 60);

				expect(dispatch).toHaveBeenCalledWith({ type: "RESET_ZOOM" });
				expect(getZoomActions()).toHaveLength(0);
			});

			it("does not zoom an image shown in its natural size", () => {
				const result = setup({}, { height: 50, width: 100 });

				click(result, 290, 60);

				expect(getZoomActions()).toHaveLength(0);
			});

			it("does nothing before the image is loaded", () => {
				const { result } = renderImage();

				click(result, 290, 60);

				expect(dispatch).not.toHaveBeenCalled();
			});
		});

		describe("wheel", () => {
			it("zooms in by a step at the cursor", () => {
				setup();

				wheel({ clientX: 250, clientY: 50, deltaY: -3 });

				expect(dispatch).toHaveBeenCalledWith({
					payload: { offset: { x: 0, y: 0 }, scale: 0.625 },
					type: "ZOOM",
				});
			});

			it("zooms out from the current zoom", () => {
				setup({ zoom: { offset: { x: 0, y: 0 }, scale: 2 } });

				wheel({ clientX: 250, clientY: 50, deltaY: 3 });

				expect(dispatch).toHaveBeenCalledWith({
					payload: { offset: { x: 0, y: 0 }, scale: 1.6 },
					type: "ZOOM",
				});
			});

			it("fits the image when zooming out below the fit", () => {
				setup();
				dispatch.mockClear();

				wheel({ deltaY: 3 });

				expect(dispatch).toHaveBeenCalledExactlyOnceWith({
					type: "RESET_ZOOM",
				});
			});

			it("stops at 400%", () => {
				setup({ zoom: { offset: { x: 0, y: 0 }, scale: 3.5 } });

				wheel({ clientX: 250, clientY: 50, deltaY: -3 });

				expect(dispatch).toHaveBeenCalledWith({
					payload: { offset: { x: 0, y: 0 }, scale: 4 },
					type: "ZOOM",
				});
			});

			it("does nothing at 400%", () => {
				setup({ zoom: { offset: { x: 0, y: 0 }, scale: 4 } });

				wheel({ deltaY: -3 });

				expect(getZoomActions()).toHaveLength(0);
			});

			it("prevents the default action", () => {
				setup();

				expect(wheel({ deltaY: -3 }).defaultPrevented).toBe(true);
			});

			it("does not zoom on a trackpad scroll", () => {
				setup();

				const e = wheel({ deltaMode: WheelEvent.DOM_DELTA_PIXEL, deltaY: 10 });

				expect(e.defaultPrevented).toBe(true);
				expect(getZoomActions()).toHaveLength(0);
			});

			it("stops listening on unmount", () => {
				const { unmount } = renderImage();
				unmount();

				expect(wheel({ deltaY: -3 }).defaultPrevented).toBe(false);
			});
		});

		describe("move", () => {
			// At 100% the image is 400x200 in the container of 500x100: it's larger
			// on the y axis only, and moves by up to 50 px up and down.
			const NATURAL: Zoom = { offset: { x: 0, y: 0 }, scale: 1 };

			const scroll = (deltaX: number, deltaY: number) =>
				wheel({ deltaMode: WheelEvent.DOM_DELTA_PIXEL, deltaX, deltaY });

			const pointer = (clientX: number, clientY: number) =>
				({
					button: 0,
					clientX,
					clientY,
					currentTarget: { setPointerCapture: vi.fn() },
					isPrimary: true,
					pointerId: 1,
					pointerType: "mouse",
				}) as unknown as PointerEvent<HTMLImageElement>;

			describe("trackpad", () => {
				it("moves a zoomed image along the axis on which it's larger", () => {
					setup({ zoom: NATURAL });

					scroll(10, 30);

					expect(dispatch).toHaveBeenCalledWith({
						payload: { offset: { x: 0, y: -30 }, scale: 1 },
						type: "ZOOM",
					});
				});

				it("stops the edges at the borders", () => {
					setup({ zoom: NATURAL });

					scroll(0, 300);

					expect(dispatch).toHaveBeenCalledWith({
						payload: { offset: { x: 0, y: -50 }, scale: 1 },
						type: "ZOOM",
					});
				});

				it("does nothing when the image is already at the border", () => {
					setup({ zoom: { offset: { x: 0, y: -50 }, scale: 1 } });

					scroll(0, 30);

					expect(getZoomActions()).toHaveLength(0);
				});

				it("does not move a fitted image", () => {
					setup();

					scroll(10, 30);

					expect(getZoomActions()).toHaveLength(0);
				});
			});

			describe("mouse", () => {
				it("moves a zoomed image with the pointer", () => {
					const result = setup({ zoom: NATURAL });

					act(() => result.current.onPointerDown?.(pointer(100, 50)));
					act(() => result.current.onPointerMove?.(pointer(120, 20)));

					expect(dispatch).toHaveBeenCalledWith({
						payload: { offset: { x: 0, y: -30 }, scale: 1 },
						type: "ZOOM",
					});
				});

				it("moves from the offset where the drag started", () => {
					const result = setup({ zoom: { offset: { x: 0, y: 10 }, scale: 1 } });

					act(() => result.current.onPointerDown?.(pointer(100, 50)));
					act(() => result.current.onPointerMove?.(pointer(100, 30)));
					act(() => result.current.onPointerMove?.(pointer(100, 10)));

					expect(getZoomActions().map(([action]) => action.payload)).toEqual([
						{ offset: { x: 0, y: -10 }, scale: 1 },
						{ offset: { x: 0, y: -30 }, scale: 1 },
					]);
				});

				it("shows the grabbing cursor while dragging", () => {
					const result = setup({ zoom: NATURAL });

					act(() => result.current.onPointerDown?.(pointer(100, 50)));
					act(() => result.current.onPointerMove?.(pointer(100, 30)));

					expect(result.current.style?.cursor).toBe("grabbing");

					act(() => result.current.onPointerUp?.(pointer(100, 30)));

					expect(result.current.style?.cursor).toBe("zoom-out");
				});

				it("does not move a fitted image", () => {
					const result = setup();

					act(() => result.current.onPointerDown?.(pointer(100, 50)));
					act(() => result.current.onPointerMove?.(pointer(100, 30)));

					expect(getZoomActions()).toHaveLength(0);
				});
			});
		});

		describe("cursor", () => {
			it("offers to zoom in a shrunk image", () => {
				expect(setup().current.style?.cursor).toBe("zoom-in");
			});

			it("offers to zoom out a zoomed image", () => {
				expect(setup({ zoom: ZOOM }).current.style?.cursor).toBe("zoom-out");
			});

			it("keeps the default cursor on an image in its natural size", () => {
				const result = setup({}, { height: 50, width: 100 });

				expect(result.current.style?.cursor).toBeUndefined();
			});
		});
	});

	describe("container", () => {
		it("observes the container element", () => {
			const container = { current: document.createElement("div") };

			renderImage({}, container);

			expect(observe).toHaveBeenCalledExactlyOnceWith(container.current);
		});

		it("does not observe anything without a container element", () => {
			renderImage({}, { current: null });

			expect(observe).not.toHaveBeenCalled();
		});

		it("stops observing on unmount", () => {
			const { unmount } = renderImage();

			unmount();

			expect(disconnect).toHaveBeenCalledOnce();
		});
	});
});
