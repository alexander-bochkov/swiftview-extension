import type { Nullable } from "@shared/types";
import { type RefObject, useLayoutEffect } from "react";
import type { ViewerStore } from "../use-viewer-store";

type UseBlockingTransitionOptions = {
	boxRef: RefObject<Nullable<HTMLElement>>;
	store: ViewerStore;
};

// Only the transform moves the box of the image. Another animation, such as
// an infinite one, may never finish and would keep the blocked tools waiting
// forever.
const isTransformTransition = (animation: Animation): boolean =>
	"transitionProperty" in animation &&
	animation.transitionProperty === "transform";

export const useBlockingTransition = ({
	boxRef,
	store,
}: UseBlockingTransitionOptions): void => {
	// A layout effect aborts the old wait during the commit. A later cleanup
	// could run after the browser cancels the old transition, which would look
	// like its end.
	useLayoutEffect(() => {
		const box = boxRef.current;
		const { dispatch, state } = store;

		if (!box || !state.blockingTransition) return;

		// The new transform is committed, so its transitions can be awaited. An
		// image that doesn't move on screen gets none and advances at once. A
		// cancelled one rejects, so it's settled rather than fulfilled.
		const transitions = box
			.getAnimations()
			.filter(isTransformTransition)
			.map(({ finished }) => finished);

		const controller = new AbortController();

		void Promise.allSettled(transitions).then(() => {
			if (controller.signal.aborted) return;

			dispatch({ type: "ADVANCE_BLOCKING_TRANSITION" });
		});

		return () => controller.abort();
		// Depends on the whole store: a resize during a phase replaces its
		// transition, so it's awaited again.
	}, [boxRef, store]);
};
