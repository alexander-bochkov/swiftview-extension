import type { Nullable } from "@shared/types";
import { type RefObject, useEffect } from "react";
import type { ViewerStore } from "../use-viewer-store";

type UseRotationOptions = {
	imageRef: RefObject<Nullable<HTMLImageElement>>;
	store: ViewerStore;
	transform: string;
};

// A rotation advances when the transitions of its step end: the return to the
// fitted size before the turn, then the turn itself.
export const useRotation = ({
	imageRef,
	store: { dispatch, state },
	transform,
}: UseRotationOptions): void => {
	const { isRotating, pendingRotation } = state;

	// biome-ignore lint/correctness/useExhaustiveDependencies: a transform that changes during a step replaces its transition, so it's awaited again.
	useEffect(() => {
		const image = imageRef.current;
		if (!image || !isRotating) return;

		// The new transform is committed, so its transitions can be awaited. An
		// image that doesn't move on screen gets none and advances at once. A
		// cancelled one rejects, so it's settled rather than fulfilled.
		const transitions = image.getAnimations().map(({ finished }) => finished);

		const controller = new AbortController();

		void Promise.allSettled(transitions).then(() => {
			if (controller.signal.aborted) return;

			dispatch({
				type: pendingRotation ? "APPLY_PENDING_ROTATION" : "END_ROTATION",
			});
		});

		return () => controller.abort();
	}, [dispatch, imageRef, isRotating, pendingRotation, transform]);
};
