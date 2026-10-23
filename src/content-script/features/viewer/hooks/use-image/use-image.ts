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

	const { flipX, flipY, rotation, scale } = store.state.image;

	const scaleX = scale * flipX;
	const scaleY = scale * flipY;

	const translate = selectImageTranslate(store.state);

	return {
		...dragProps,
		...zoomProps,
		onLoad: ({ currentTarget: { naturalHeight, naturalWidth } }) => {
			store.dispatch({
				payload: {
					height: naturalHeight,
					width: naturalWidth,
				},
				type: "LOAD",
			});
		},
		style: {
			// Hidden by `display`, so the image appears fitted without a transition.
			display: selectIsReady(store.state) ? undefined : "none",
			// `scale()` must come before `rotate()`: each function transforms the
			// coordinate space left to right, so the flip happens along the screen
			// axes. In the opposite order it would follow the rotated image axes.
			transform: `translate(${translate.x}px, ${translate.y}px) scale(${scaleX}, ${scaleY}) rotate(${rotation}deg)`,
		},
	};
};
