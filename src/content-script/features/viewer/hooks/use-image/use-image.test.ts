import { act, cleanup, renderHook } from "@testing-library/react";
import type { RefObject, SyntheticEvent } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ViewerStore } from "../use-viewer-store";
import { useImage } from "./use-image";

type Size = { height: number; width: number };

describe("useImage", () => {
	const disconnect = vi.fn();
	const observe = vi.fn();
	let notify: (size: Size) => void;

	// jsdom doesn't implement ResizeObserver, so capture the callback and let
	// the tests report the container size themselves.
	beforeEach(() => {
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
		container: RefObject<HTMLElement | null> = {
			current: document.createElement("div"),
		},
	) => {
		const store: ViewerStore = {
			dispatch: vi.fn(),
			state: { rotation: 0, scaleX: 1, scaleY: 1, ...state },
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
