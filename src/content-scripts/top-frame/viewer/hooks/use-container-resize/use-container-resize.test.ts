import { act, cleanup, renderHook } from "@testing-library/react";
import type { RefObject } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ViewerStore } from "../use-viewer-store";
import { useContainerResize } from "./use-container-resize";

type Size = { height: number; width: number };

describe("useContainerResize", () => {
	const disconnect = vi.fn();
	const dispatch = vi.fn();
	const observe = vi.fn();
	let notify: (entries: ResizeObserverEntry[]) => void;

	beforeEach(() => {
		// jsdom doesn't implement ResizeObserver, so capture the callback and
		// let the tests report the container size themselves.
		vi.stubGlobal(
			"ResizeObserver",
			class {
				constructor(callback: ResizeObserverCallback) {
					notify = (entries) =>
						callback(entries, this as unknown as ResizeObserver);
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

	const renderResize = (
		containerRef: RefObject<HTMLElement | null> = {
			current: document.createElement("div"),
		},
	) => {
		const store = { dispatch } as unknown as ViewerStore;

		return renderHook(() => useContainerResize({ containerRef, store }));
	};

	const resize = (size: Size) =>
		act(() => notify([{ contentRect: size } as ResizeObserverEntry]));

	it("observes the container element", () => {
		const containerRef = { current: document.createElement("div") };

		renderResize(containerRef);

		expect(observe).toHaveBeenCalledExactlyOnceWith(containerRef.current);
	});

	it("reports the content size of the container", () => {
		renderResize();

		resize({ height: 100, width: 500 });

		expect(dispatch).toHaveBeenCalledExactlyOnceWith({
			payload: { height: 100, width: 500 },
			type: "RESIZE",
		});
	});

	it("ignores a notification without entries", () => {
		renderResize();

		act(() => notify([]));

		expect(dispatch).not.toHaveBeenCalled();
	});

	it("does not observe anything without a container element", () => {
		renderResize({ current: null });

		expect(observe).not.toHaveBeenCalled();
	});

	it("stops observing on unmount", () => {
		const { unmount } = renderResize();

		unmount();

		expect(disconnect).toHaveBeenCalledOnce();
	});
});
