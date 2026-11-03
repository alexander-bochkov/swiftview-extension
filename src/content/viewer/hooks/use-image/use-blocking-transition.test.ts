import type { Nullable } from "@shared/types";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BlockingTransition, ViewerStore } from "../use-viewer-store";
import { useBlockingTransition } from "./use-blocking-transition";

// A transition of the property whose end the test controls.
const createTransition = (transitionProperty = "transform") => {
	const { promise, reject, resolve } = Promise.withResolvers<Animation>();

	return {
		cancel: () => reject(new DOMException("", "AbortError")),
		end: () => resolve({} as Animation),
		transition: { finished: promise, transitionProperty } as CSSTransition,
	};
};

const FITTING: BlockingTransition = { direction: "right", phase: "fitting" };
const SETTLING: BlockingTransition = { phase: "settling" };

const ADVANCE = { type: "ADVANCE_BLOCKING_TRANSITION" };

describe("useBlockingTransition", () => {
	const dispatch = vi.fn();
	// jsdom doesn't implement animations: no transitions by default.
	const getAnimations = vi.fn((): Animation[] => []);
	let image: HTMLImageElement;

	beforeEach(() => {
		image = document.createElement("img");
		image.getAnimations = getAnimations;
	});

	// Vitest globals are off, so Testing Library can't register this itself.
	afterEach(() => {
		cleanup();
		vi.resetAllMocks();
	});

	const createStore = (blockingTransition: Nullable<BlockingTransition>) =>
		({
			dispatch,
			state: { blockingTransition },
		}) as unknown as ViewerStore;

	const renderTransition = (
		blockingTransition: Nullable<BlockingTransition> = FITTING,
	) => {
		const imageRef = { current: image };

		return renderHook(
			({ store }) => useBlockingTransition({ imageRef, store }),
			{ initialProps: { store: createStore(blockingTransition) } },
		);
	};

	it.each([
		["the return", FITTING],
		["settling", SETTLING],
	])(
		"reports the end of the transitions of %s",
		async (_, blockingTransition) => {
			const transition = createTransition();
			getAnimations.mockReturnValueOnce([transition.transition]);
			renderTransition(blockingTransition);

			await act(async () => {});

			expect(dispatch).not.toHaveBeenCalled();

			await act(async () => transition.end());

			expect(dispatch).toHaveBeenCalledExactlyOnceWith(ADVANCE);
		},
	);

	it("doesn't wait for the other animations", async () => {
		// Neither ever ends.
		const fade = createTransition("opacity");
		const shimmer = { finished: new Promise(() => {}) } as Animation;
		getAnimations.mockReturnValueOnce([fade.transition, shimmer]);
		renderTransition();

		await vi.waitFor(() => expect(dispatch).toHaveBeenCalledWith(ADVANCE));
	});

	it("advances when a transition is cancelled", async () => {
		const fit = createTransition();
		getAnimations.mockReturnValueOnce([fit.transition]);
		renderTransition();

		await act(async () => fit.cancel());

		expect(dispatch).toHaveBeenCalledExactlyOnceWith(ADVANCE);
	});

	it("advances at once without a transition", async () => {
		renderTransition(SETTLING);

		await vi.waitFor(() => expect(dispatch).toHaveBeenCalledWith(ADVANCE));
	});

	it("awaits the transitions of a new state instead", async () => {
		const fit = createTransition();
		const resize = createTransition();
		getAnimations
			.mockReturnValueOnce([fit.transition])
			.mockReturnValueOnce([resize.transition]);
		const { rerender } = renderTransition();

		rerender({ store: createStore(FITTING) });
		// A new transform replaces the transition of the old one.
		await act(async () => fit.cancel());

		expect(dispatch).not.toHaveBeenCalled();

		await act(async () => resize.end());

		expect(dispatch).toHaveBeenCalledExactlyOnceWith(ADVANCE);
	});

	it("does not advance after the image is removed", async () => {
		const fit = createTransition();
		getAnimations.mockReturnValueOnce([fit.transition]);
		const { unmount } = renderTransition();

		unmount();
		await act(async () => fit.end());

		expect(dispatch).not.toHaveBeenCalled();
	});

	it("does nothing without a blocking transition", async () => {
		renderTransition(null);

		await act(async () => {});

		expect(getAnimations).not.toHaveBeenCalled();
		expect(dispatch).not.toHaveBeenCalled();
	});
});
