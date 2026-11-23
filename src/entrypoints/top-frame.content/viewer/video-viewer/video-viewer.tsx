import { useLayoutEffect } from "react";
import { ExternalElement, Toolbar } from "../components";
import styles from "./video-viewer.module.css";

type VideoViewerProps = {
	onClose: () => void;
	video: HTMLVideoElement;
};

export const VideoViewer = ({ onClose, video }: VideoViewerProps) => {
	useLayoutEffect(() => {
		video.controls = true;
		// Focused for the keys of the controls.
		video.focus();
	}, [video]);

	return (
		<>
			<Toolbar onClose={onClose} />
			<ExternalElement className={styles.box} element={video} />
		</>
	);
};
