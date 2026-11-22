import { useRef } from "react";
import type { ViewerProps } from "../types";
import { Loader, MediaError, Overlay, Toolbar } from "./components";
import { ImageViewer } from "./image-viewer";
import { useMediaProbe } from "./use-media-probe";
import { VideoViewer } from "./video-viewer";
import styles from "./viewer.module.css";

export const Viewer = ({ candidates, onClose }: ViewerProps) => {
	const overlayRef = useRef<HTMLDialogElement>(null);
	const probe = useMediaProbe(candidates);

	return (
		<Overlay className={styles.viewer} onClose={onClose} ref={overlayRef}>
			{({ onRequestClose }) => {
				if (probe.status === "loaded") {
					return probe.element instanceof HTMLImageElement ? (
						<ImageViewer
							containerRef={overlayRef}
							image={probe.element}
							onClose={onRequestClose}
						/>
					) : (
						<VideoViewer onClose={onRequestClose} video={probe.element} />
					);
				}

				return (
					<>
						<Toolbar onClose={onRequestClose} />
						{probe.status === "loading" ? <Loader /> : <MediaError />}
					</>
				);
			}}
		</Overlay>
	);
};
