import { type RefObject, useLayoutEffect } from "react";
import type { Nullable, Point } from "@/shared/types";
import { ExternalElement, Toolbar } from "../components";
import {
	selectIsReady,
	useContainerResize,
	useImageBox,
	useViewerStore,
} from "./hooks";
import { ImageTools } from "./image-tools";
import styles from "./image-viewer.module.css";

type ImageViewerProps = {
	containerRef: RefObject<Nullable<HTMLElement>>;
	image: HTMLImageElement;
	onClose: () => void;
};

// Points are measured from the center of the container. Zooming to it keeps
// the part of the image in the center where it is, unless the image has to
// move to stay within its bounds.
const CONTAINER_CENTER: Point = { x: 0, y: 0 };

export const ImageViewer = ({
	containerRef,
	image,
	onClose,
}: ImageViewerProps) => {
	const store = useViewerStore({
		height: image.naturalHeight,
		width: image.naturalWidth,
	});
	const { scale } = store.state;

	useContainerResize({ containerRef, store });
	const boxProps = useImageBox({ containerRef, store });

	// A native drag of the image would compete with the drag of the box.
	useLayoutEffect(() => {
		image.draggable = false;
	}, [image]);

	const isReady = selectIsReady(store.state);

	return (
		<>
			<Toolbar
				onClose={onClose}
				tools={
					isReady && (
						<ImageTools
							onFlip={(direction) =>
								store.dispatch({ payload: direction, type: "FLIP" })
							}
							onRotate={(direction) =>
								store.dispatch({ payload: direction, type: "ROTATE" })
							}
							onToggleZoom={() =>
								store.dispatch({
									payload: CONTAINER_CENTER,
									type: "TOGGLE_ZOOM",
								})
							}
							scale={scale}
						/>
					)
				}
			/>
			<ExternalElement {...boxProps} className={styles.box} element={image} />
		</>
	);
};
