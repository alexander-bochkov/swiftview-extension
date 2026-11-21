import { useRef } from "react";
import { Loader, MediaError, Overlay, Toolbar } from "../components";
import { ImageViewer } from "../image-viewer";
import type { ViewerProps } from "../types";
import { VideoViewer } from "../video-viewer";
import styles from "./media-viewer.module.css";
import { useMediaProbe } from "./use-media-probe";

export const MediaViewer = ({ candidates, onClose }: ViewerProps) => {
	const overlayRef = useRef<HTMLDialogElement>(null);
	const probe = useMediaProbe(candidates);

	return (
		<Overlay className={styles.mediaViewer} onClose={onClose} ref={overlayRef}>
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
