import { Icon, Overlay } from "../../components";
import {
	selectIsReady,
	useImage,
	useModalDialog,
	useViewerStore,
} from "./hooks";
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

	const isReady = selectIsReady(store.state);

	return (
		<Overlay className={styles.viewer} {...dialog}>
			<Toolbar
				hideTools={!isReady}
				onClose={onClose}
				onFlip={(direction) =>
					store.dispatch({ payload: direction, type: "FLIP" })
				}
				onRotate={(direction) =>
					store.dispatch({ payload: direction, type: "ROTATE" })
				}
			/>
			{!isReady && <Icon className={styles.loader} name="spinner" />}
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
