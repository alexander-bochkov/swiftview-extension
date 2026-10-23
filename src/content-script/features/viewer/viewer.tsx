import { Overlay } from "../../components";
import { useImage, useModalDialog, useViewerStore } from "./hooks";
import { Toolbar } from "./toolbar";
import styles from "./viewer.module.css";

type ViewerProps = {
	onClose: () => void;
	url: string;
};

export const Viewer = ({ onClose, url }: ViewerProps) => {
	const store = useViewerStore();

	const dialog = useModalDialog({ onClose });
	const image = useImage({ containerRef: dialog.ref, store });

	return (
		<Overlay className={styles.viewer} {...dialog}>
			<Toolbar
				onClose={onClose}
				onFlip={(direction) =>
					store.dispatch({ payload: direction, type: "FLIP" })
				}
				onRotate={(direction) =>
					store.dispatch({ payload: direction, type: "ROTATE" })
				}
			/>
			<img
				alt=""
				className={styles.image}
				draggable={false}
				src={url}
				{...image}
			/>
		</Overlay>
	);
};
