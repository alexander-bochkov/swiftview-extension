import type { Point } from "@shared/types";
import { useRef } from "react";
import { Icon, ImageError, Overlay, Toolbar } from "./components";
import {
	selectIsReady,
	useContainerResize,
	useImage,
	useViewerStore,
} from "./hooks";
import styles from "./viewer.module.css";

type ViewerProps = {
	onClose: () => void;
	url: string;
};

// Points are measured from the center of the container. Zooming to it keeps
// the part of the image in the center where it is, unless the image has to
// move to stay within its bounds.
const CONTAINER_CENTER: Point = { x: 0, y: 0 };

export const Viewer = ({ onClose, url }: ViewerProps) => {
	const overlayRef = useRef<HTMLDialogElement>(null);

	const store = useViewerStore();
	const { hasImageError, scale } = store.state;

	useContainerResize({ containerRef: overlayRef, store });
	const imageProps = useImage({ containerRef: overlayRef, store });

	const isReady = selectIsReady(store.state);

	return (
		<Overlay className={styles.viewer} onClose={onClose} ref={overlayRef}>
			{({ onRequestClose }) => (
				<>
					<Toolbar
						hideTools={!isReady}
						onClose={onRequestClose}
						onFlip={(direction) =>
							store.dispatch({ payload: direction, type: "FLIP" })
						}
						onRotate={(direction) =>
							store.dispatch({ payload: direction, type: "ROTATE" })
						}
						onToggleZoom={() =>
							store.dispatch({ payload: CONTAINER_CENTER, type: "TOGGLE_ZOOM" })
						}
						scale={scale}
					/>
					{hasImageError && <ImageError />}
					{!isReady && !hasImageError && (
						<Icon className={styles.loader} name="spinner" />
					)}
					<img
						{...imageProps}
						alt=""
						className={styles.image}
						draggable={false}
						src={url}
					/>
				</>
			)}
		</Overlay>
	);
};
