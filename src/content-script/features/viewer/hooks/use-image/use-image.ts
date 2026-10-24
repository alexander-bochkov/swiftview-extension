import type { Nullable } from "@shared/types";
import type { ComponentProps, RefObject } from "react";
import {
	selectImageTranslate,
	selectIsReady,
	type ViewerStore,
} from "../use-viewer-store";
import { useContainerResize } from "./use-container-resize";
import { useImageDrag } from "./use-image-drag";
import { useImageZoom } from "./use-image-zoom";

type UseImageOptions = {
	containerRef: RefObject<Nullable<HTMLElement>>;
	store: ViewerStore;
};

type UseImageReturn = ReturnType<typeof useImageDrag> &
	ReturnType<typeof useImageZoom> &
	Pick<ComponentProps<"img">, "onLoad" | "style">;

export const useImage = ({
	containerRef,
	store,
}: UseImageOptions): UseImageReturn => {
	useContainerResize({ containerRef, store });

	const dragProps = useImageDrag({ store });
	const zoomProps = useImageZoom({ containerRef, store });

	const { flipX, flipY, naturalHeight, naturalWidth, rotation, scale } =
		store.state.image;

	const scaleX = scale * flipX;
	const scaleY = scale * flipY;

	const translate = selectImageTranslate(store.state);

	// The translate is calculated for the layout box in the natural size. An SVG
	// without its own size, such as one with only a `viewBox`, gets a box of a
	// different size from the browser, and the transform would scale it around
	// a different center.
	const layoutSize = {
		height: naturalHeight ?? undefined,
		width: naturalWidth ?? undefined,
	};

	return {
		...dragProps,
		...zoomProps,
		onLoad: ({ currentTarget }) => {
			store.dispatch({
				payload: {
					height: currentTarget.naturalHeight,
					width: currentTarget.naturalWidth,
				},
				type: "LOAD",
			});
		},
		style: {
			...layoutSize,
			// Hidden by `display`, so the image appears fitted without a transition.
			display: selectIsReady(store.state) ? undefined : "none",
			// Each function transforms the coordinate space left to right.
			// `translate()` must come first, so it moves the image by screen px.
			// After `scale()`, it would be multiplied by the scale and reversed by
			// a flip. `scale()` must come before `rotate()`, so the flip happens
			// along the screen axes, not the rotated image axes.
			transform: `translate(${translate.x}px, ${translate.y}px) scale(${scaleX}, ${scaleY}) rotate(${rotation}deg)`,
		},
	};
};
