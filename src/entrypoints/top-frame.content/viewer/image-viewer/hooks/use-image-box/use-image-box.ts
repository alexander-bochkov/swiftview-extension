import {
	type ComponentProps,
	type RefObject,
	useLayoutEffect,
	useRef,
} from "react";
import type { Nullable } from "@/shared/types";
import {
	selectImageTranslate,
	selectIsReady,
	type ViewerStore,
} from "../use-viewer-store";
import { useBlockingTransition } from "./use-blocking-transition";
import { useImageDrag } from "./use-image-drag";
import { useImageZoom } from "./use-image-zoom";

type UseImageBoxOptions = {
	containerRef: RefObject<Nullable<HTMLElement>>;
	store: ViewerStore;
};

// The props of the box of the image: the transform moves the box, and the
// pointer handlers listen on it.
type UseImageBoxReturn = ReturnType<typeof useImageDrag> &
	ReturnType<typeof useImageZoom> &
	Pick<ComponentProps<"div">, "ref" | "style" | "tabIndex">;

export const useImageBox = ({
	containerRef,
	store,
}: UseImageBoxOptions): UseImageBoxReturn => {
	const boxRef = useRef<HTMLDivElement>(null);

	useBlockingTransition({ boxRef, store });

	const dragProps = useImageDrag({ store });
	const zoomProps = useImageZoom({ containerRef, store });

	const { flip, naturalSize, rotation, scale } = store.state;

	const isReady = selectIsReady(store.state);

	// Focused for the keys of the viewer, like Escape to close it. The viewer
	// replaces the toolbar of the loading media, so the focus of its close
	// button would fall back to the page, whose keys the viewer doesn't get.
	// Once shown, as a box hidden by `display` can't be focused. Without the
	// scroll, as the box can be larger than the container.
	useLayoutEffect(() => {
		if (isReady) boxRef.current?.focus({ preventScroll: true });
	}, [isReady]);

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
			display: isReady ? undefined : "none",
			// Each function transforms the coordinate space left to right.
			// `translate()` must come first, so it moves the image by screen px. After
			// `scale()`, it would be multiplied by the scale and reversed by a flip.
			// `scale()` must come before `rotate()`, so the flip happens along the
			// screen axes, not the rotated image axes.
			transform: `translate(${translate.x}px, ${translate.y}px) scale(${scaleX}, ${scaleY}) rotate(${rotation}deg)`,
		},
		// Focusable from the code only, see above.
		tabIndex: -1,
	};
};
