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

	const { close, ...dialogProps } = useModalDialog({ onClose });
	const imageProps = useImage({ containerRef: dialogProps.ref, store });

	const isReady = selectIsReady(store.state);

	return (
		<Overlay {...dialogProps} className={styles.viewer}>
			<Toolbar
				hideTools={!isReady}
				onClose={close}
				onFlip={(direction) =>
					store.dispatch({ payload: direction, type: "FLIP" })
				}
				onRotate={(direction) =>
					store.dispatch({ payload: direction, type: "ROTATE" })
				}
			/>
			{!isReady && <Icon className={styles.loader} name="spinner" />}
			<img
				{...imageProps}
				alt=""
				className={styles.image}
				draggable={false}
				src={url}
			/>
		</Overlay>
	);
};
