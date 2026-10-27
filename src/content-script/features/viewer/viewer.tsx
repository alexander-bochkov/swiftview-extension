import { useRef } from "react";
import { Icon, Overlay } from "../../components";
import {
	selectIsReady,
	useContainerResize,
	useImage,
	useViewerStore,
} from "./hooks";
import { ImageError } from "./image-error";
import { Toolbar } from "./toolbar";
import styles from "./viewer.module.css";

type ViewerProps = {
	onClose: () => void;
	url: string;
};

export const Viewer = ({ onClose, url }: ViewerProps) => {
	const overlayRef = useRef<HTMLDialogElement>(null);

	const store = useViewerStore();

	useContainerResize({ containerRef: overlayRef, store });
	const imageProps = useImage({ containerRef: overlayRef, store });

	const isReady = selectIsReady(store.state);
	const { hasImageError } = store.state;

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
						scale={store.state.scale}
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
