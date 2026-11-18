import { useEffect, useLayoutEffect } from "react";
import { KEY_CODE } from "@/shared/constants";
import { ElementSlot, Toolbar } from "../components";
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

	// Escape is locked in fullscreen, see EscapeKeyLock, so the key reaches the
	// video instead of exiting its fullscreen. Exits only the fullscreen of the
	// video, so an element of the page in fullscreen below stays in it. Stopped
	// here, so the viewer doesn't close too.
	useEffect(() => {
		const controller = new AbortController();

		video.addEventListener(
			"keydown",
			(e) => {
				// The document sees the video of the viewer in fullscreen as the
				// host, so it's asked from the shadow root.
				const root = video.getRootNode() as Document | ShadowRoot;

				if (e.code !== KEY_CODE.ESCAPE || root.fullscreenElement !== video) {
					return;
				}

				e.stopPropagation();
				document.exitFullscreen().catch(() => {
					// Left fullscreen in the meantime
				});
			},
			{ signal: controller.signal },
		);

		return () => controller.abort();
	}, [video]);

	return (
		<>
			<Toolbar onClose={onClose} />
			<ElementSlot className={styles.slot} element={video} />
		</>
	);
};
