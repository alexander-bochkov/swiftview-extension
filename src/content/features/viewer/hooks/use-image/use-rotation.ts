import type { Nullable } from "@shared/types";
import { type RefObject, useEffect } from "react";
import type { ViewerStore } from "../use-viewer-store";

type UseRotationOptions = {
	imageRef: RefObject<Nullable<HTMLImageElement>>;
	store: ViewerStore;
	transform: string;
};

// Only the transform moves the image. Another animation, such as an infinite
// one, may never finish and would keep the rotation, and the blocked tools,
// waiting forever.
const isTransformTransition = (animation: Animation): boolean =>
	"transitionProperty" in animation &&
	animation.transitionProperty === "transform";

// A rotation advances when the transitions of its step end: the return to the
// fitted size before the turn, then the turn itself.
export const useRotation = ({
	imageRef,
	store: { dispatch, state },
	transform,
}: UseRotationOptions): void => {
	const phase = state.rotationStep?.phase;

	// biome-ignore lint/correctness/useExhaustiveDependencies: a transform that changes during a step replaces its transition, so it's awaited again.
	useEffect(() => {
		const image = imageRef.current;
		if (!image || !phase) return;

		// The new transform is committed, so its transitions can be awaited. An
		// image that doesn't move on screen gets none and advances at once. A
		// cancelled one rejects, so it's settled rather than fulfilled.
		const transitions = image
			.getAnimations()
			.filter(isTransformTransition)
			.map(({ finished }) => finished);

		const controller = new AbortController();

		void Promise.allSettled(transitions).then(() => {
			if (controller.signal.aborted) return;

			dispatch({
				type: phase === "fitting" ? "APPLY_PENDING_ROTATION" : "END_ROTATION",
			});
		});

		return () => controller.abort();
	}, [dispatch, imageRef, phase, transform]);
};
