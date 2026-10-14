import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ViewerStore } from "../use-viewer-store";
import { useToolbar } from "./use-toolbar";

describe("useToolbar", () => {
	const dispatch = vi.fn();
	const onClose = vi.fn();

	const store: ViewerStore = {
		dispatch,
		state: { rotation: 0, scaleX: 1, scaleY: 1 },
	};

	// Vitest globals are off, so Testing Library can't register this itself.
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	const renderToolbar = () =>
		renderHook(() => useToolbar({ onClose, store })).result.current;

	it("passes onClose through", () => {
		expect(renderToolbar().onClose).toBe(onClose);
	});

	it.each(["horizontal", "vertical"] as const)(
		"dispatches FLIP with the %s direction",
		(direction) => {
			renderToolbar().onFlip(direction);

			expect(dispatch).toHaveBeenCalledExactlyOnceWith({
				payload: direction,
				type: "FLIP",
			});
		},
	);

	it.each(["left", "right"] as const)(
		"dispatches ROTATE with the %s direction",
		(direction) => {
			renderToolbar().onRotate(direction);

			expect(dispatch).toHaveBeenCalledExactlyOnceWith({
				payload: direction,
				type: "ROTATE",
			});
		},
	);
});
