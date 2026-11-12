import type { Nullable } from "@shared/types";
import {
	type ComponentProps,
	type RefObject,
	useLayoutEffect,
	useRef,
} from "react";
import {
	selectImageTranslate,
	selectIsReady,
	type ViewerStore,
} from "../use-viewer-store";
import { useBlockingTransition } from "./use-blocking-transition";
import { useImageDrag } from "./use-image-drag";
import { useImageZoom } from "./use-image-zoom";

type UseImageOptions = {
	containerRef: RefObject<Nullable<HTMLElement>>;
	image: HTMLImageElement;
	store: ViewerStore;
};

// The props of the box of the image: the transform moves the box, and the
// pointer handlers listen on it.
type UseImageReturn = ReturnType<typeof useImageDrag> &
	ReturnType<typeof useImageZoom> &
	Pick<ComponentProps<"div">, "ref" | "style">;

export const useImage = ({
	containerRef,
	image,
	store,
}: UseImageOptions): UseImageReturn => {
	const boxRef = useRef<HTMLDivElement>(null);

	useBlockingTransition({ boxRef, store });

	const dragProps = useImageDrag({ store });
	const zoomProps = useImageZoom({ containerRef, store });

	const { flip, naturalSize, rotation, scale } = store.state;

	// A native drag of the image would compete with the drag of the box.
	useLayoutEffect(() => {
		image.draggable = false;
	}, [image]);

	const scaleX = scale * flip.x;
	const scaleY = scale * flip.y;

	const translate = selectImageTranslate(store.state);

	return {
		...dragProps,
		...zoomProps,
		ref: boxRef,
		style: {
			// The translate is calculated for the layout box in the natural size. An
			// SVG without its own size, such as one with only a `viewBox`, gets a box
			// of a different size from the browser, and the transform would scale it
			// around a different center.
			...naturalSize,
			// Hidden by `display`, so the image appears fitted without a transition.
			display: selectIsReady(store.state) ? undefined : "none",
			// Each function transforms the coordinate space left to right.
			// `translate()` must come first, so it moves the image by screen px. After
			// `scale()`, it would be multiplied by the scale and reversed by a flip.
			// `scale()` must come before `rotate()`, so the flip happens along the
			// screen axes, not the rotated image axes.
			transform: `translate(${translate.x}px, ${translate.y}px) scale(${scaleX}, ${scaleY}) rotate(${rotation}deg)`,
		},
	};
};
