import { useEffect } from "react";
import { videoOptions } from "@/shared/storage";
import { ExternalElement, Toolbar } from "../components";
import styles from "./video-viewer.module.css";

type VideoViewerProps = {
	onClose: () => void;
	video: HTMLVideoElement;
};

export const VideoViewer = ({ onClose, video }: VideoViewerProps) => {
	useEffect(() => {
		let shouldApplyOptions = true;

		const showControls = (): void => {
			video.controls = true;
			// Focused for the keys of the controls.
			video.focus();
		};

		videoOptions.getValue().then(
			({ autoplay, loop, muted }) => {
				// Viewer closed before the options loaded, so the video mustn't play.
				if (!shouldApplyOptions) return;

				video.loop = loop;
				video.muted = muted;
				// After the options, so they don't undo the user's changes.
				showControls();

				if (autoplay) {
					video.play().catch(() => {
						// Blocked or interrupted.
					});
				}
			},
			(error: unknown) => {
				console.error(error);
				// Without the options, the video still gets its controls.
				if (shouldApplyOptions) showControls();
			},
		);

		return () => {
			shouldApplyOptions = false;
		};
	}, [video]);

	return (
		<>
			<Toolbar onClose={onClose} />
			<ExternalElement className={styles.box} element={video} />
		</>
	);
};
