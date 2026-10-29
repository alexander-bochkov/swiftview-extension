import { type ComponentProps, type RefObject, useRef } from "react";
import type { Nullable } from "../../../../../shared/types";
import {
	selectImageTranslate,
	selectIsReady,
	type ViewerStore,
} from "../use-viewer-store";
import { useImageDrag } from "./use-image-drag";
import { useImageZoom } from "./use-image-zoom";
import { useRotation } from "./use-rotation";

type UseImageOptions = {
	containerRef: RefObject<Nullable<HTMLElement>>;
	store: ViewerStore;
};

type UseImageReturn = ReturnType<typeof useImageDrag> &
	ReturnType<typeof useImageZoom> &
	Pick<ComponentProps<"img">, "onError" | "onLoad" | "ref" | "style">;

export const useImage = ({
	containerRef,
	store,
}: UseImageOptions): UseImageReturn => {
	const imageRef = useRef<HTMLImageElement>(null);

	const dragProps = useImageDrag({ store });
	const zoomProps = useImageZoom({ containerRef, store });

	const { flip, naturalSize, rotation, scale } = store.state;

	const scaleX = scale * flip.x;
	const scaleY = scale * flip.y;

	const translate = selectImageTranslate(store.state);

	// The translate is calculated for the layout box in the natural size. An SVG
	// without its own size, such as one with only a `viewBox`, gets a box of a
	// different size from the browser, and the transform would scale it around
	// a different center.
	const layoutSize = naturalSize ?? {};

	// Each function transforms the coordinate space left to right.
	// `translate()` must come first, so it moves the image by screen px. After
	// `scale()`, it would be multiplied by the scale and reversed by a flip.
	// `scale()` must come before `rotate()`, so the flip happens along the
	// screen axes, not the rotated image axes.
	const transform = `translate(${translate.x}px, ${translate.y}px) scale(${scaleX}, ${scaleY}) rotate(${rotation}deg)`;

	useRotation({ imageRef, store, transform });

	return {
		...dragProps,
		...zoomProps,
		onError: () => {
			store.dispatch({ type: "FAIL" });
		},
		onLoad: ({ currentTarget: { naturalHeight, naturalWidth } }) => {
			store.dispatch({
				payload: {
					height: naturalHeight,
					width: naturalWidth,
				},
				type: "LOAD",
			});
		},
		ref: imageRef,
		style: {
			...layoutSize,
			// Hidden by `display`, so the image appears fitted without a transition.
			display: selectIsReady(store.state) ? undefined : "none",
			transform,
		},
	};
};
