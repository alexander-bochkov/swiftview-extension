import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Nullable } from "../../../../../shared/types";
import type { RotationStep, ViewerStore } from "../use-viewer-store";
import { useRotation } from "./use-rotation";

// A transition of the property whose end the test controls.
const createTransition = (transitionProperty = "transform") => {
	const { promise, reject, resolve } = Promise.withResolvers<Animation>();

	return {
		cancel: () => reject(new DOMException("", "AbortError")),
		end: () => resolve({} as Animation),
		transition: { finished: promise, transitionProperty } as CSSTransition,
	};
};

const FITTING: RotationStep = { direction: "right", phase: "fitting" };
const TURNING: RotationStep = { phase: "turning" };

const APPLY = { type: "APPLY_PENDING_ROTATION" };
const END = { type: "END_ROTATION" };

describe("useRotation", () => {
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

	const renderRotation = (rotationStep: Nullable<RotationStep> = FITTING) => {
		const store = {
			dispatch,
			state: { rotationStep },
		} as unknown as ViewerStore;
		const imageRef = { current: image };

		return renderHook(
			({ transform }) => useRotation({ imageRef, store, transform }),
			{ initialProps: { transform: "scale(1)" } },
		);
	};

	it("applies the pending turn once the transition of the return ends", async () => {
		const fit = createTransition();
		getAnimations.mockReturnValueOnce([fit.transition]);
		renderRotation();

		await act(async () => {});

		expect(dispatch).not.toHaveBeenCalled();

		await act(async () => fit.end());

		expect(dispatch).toHaveBeenCalledExactlyOnceWith(APPLY);
	});

	it("doesn't wait for the other animations", async () => {
		// Neither ever ends.
		const fade = createTransition("opacity");
		const shimmer = { finished: new Promise(() => {}) } as Animation;
		getAnimations.mockReturnValueOnce([fade.transition, shimmer]);
		renderRotation();

		await vi.waitFor(() => expect(dispatch).toHaveBeenCalledWith(APPLY));
	});

	it("ends the rotation once the transitions of the turn end", async () => {
		const turn = createTransition();
		getAnimations.mockReturnValueOnce([turn.transition]);
		renderRotation(TURNING);

		await act(async () => turn.end());

		expect(dispatch).toHaveBeenCalledExactlyOnceWith(END);
	});

	it("advances when a transition is cancelled", async () => {
		const fit = createTransition();
		getAnimations.mockReturnValueOnce([fit.transition]);
		renderRotation();

		await act(async () => fit.cancel());

		expect(dispatch).toHaveBeenCalledExactlyOnceWith(APPLY);
	});

	it("advances at once without a transition", async () => {
		renderRotation(TURNING);

		await vi.waitFor(() => expect(dispatch).toHaveBeenCalledWith(END));
	});

	it("awaits the transitions of a new transform instead", async () => {
		const fit = createTransition();
		const resize = createTransition();
		getAnimations
			.mockReturnValueOnce([fit.transition])
			.mockReturnValueOnce([resize.transition]);
		const { rerender } = renderRotation();

		rerender({ transform: "scale(2)" });
		// The new transform replaces the transition of the old one.
		await act(async () => fit.cancel());

		expect(dispatch).not.toHaveBeenCalled();

		await act(async () => resize.end());

		expect(dispatch).toHaveBeenCalledExactlyOnceWith(APPLY);
	});

	it("does not advance after the image is removed", async () => {
		const fit = createTransition();
		getAnimations.mockReturnValueOnce([fit.transition]);
		const { unmount } = renderRotation();

		unmount();
		await act(async () => fit.end());

		expect(dispatch).not.toHaveBeenCalled();
	});

	it("does nothing without a rotation", async () => {
		renderRotation(null);

		await act(async () => {});

		expect(getAnimations).not.toHaveBeenCalled();
		expect(dispatch).not.toHaveBeenCalled();
	});
});
