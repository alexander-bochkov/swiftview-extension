import { Overlay } from "../../components";
import { useImage, useModalDialog, useToolbar, useViewer } from "./hooks";
import { Toolbar } from "./toolbar";
import styles from "./viewer.module.css";

type ViewerProps = {
	onClose: () => void;
	url: string;
};

export const Viewer = ({ onClose, url }: ViewerProps) => {
	const viewer = useViewer();

	const dialog = useModalDialog({ onClose });
	const toolbar = useToolbar({ onClose, viewer });
	const image = useImage({ viewer });

	return (
		<Overlay className={styles.viewer} {...dialog}>
			<Toolbar {...toolbar} />
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
