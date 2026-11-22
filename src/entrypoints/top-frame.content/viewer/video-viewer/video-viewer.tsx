import { useLayoutEffect } from "react";
import { ExternalElement, Toolbar } from "../components";
import styles from "./video-viewer.module.css";

type VideoViewerProps = {
	onClose: () => void;
	video: HTMLVideoElement;
};

// Shows a loaded video fitted into the container, with the controls of the
// browser.
export const VideoViewer = ({ onClose, video }: VideoViewerProps) => {
	// Focused for the keys of the controls: Space plays, the arrows seek and
	// change the volume.
	useLayoutEffect(() => {
		video.controls = true;
		video.loop = true;
		video.muted = true;

		video.focus();
		video.play().catch(() => {
			// Blocked or interrupted
		});
	}, [video]);

	return (
		<>
			<Toolbar onClose={onClose} />
			<ExternalElement className={styles.box} element={video} />
		</>
	);
};
