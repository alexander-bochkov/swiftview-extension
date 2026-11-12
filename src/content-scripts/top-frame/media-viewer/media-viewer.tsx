import type { MediaCandidate } from "@shared/types";
import { useEffect, useRef } from "react";
import {
	ElementSlot,
	Loader,
	MediaError,
	Overlay,
	Toolbar,
} from "../components";
import { ImageViewer } from "../image-viewer";
import styles from "./media-viewer.module.css";
import { useMediaProbe } from "./use-media-probe";

type MediaViewerProps = {
	candidates: readonly MediaCandidate[];
	onClose: () => void;
};

export const MediaViewer = ({ candidates, onClose }: MediaViewerProps) => {
	const overlayRef = useRef<HTMLDialogElement>(null);
	const probe = useMediaProbe(candidates);

	// TODO: hand the video to a video viewer. Until then it is shown as it is,
	// with the native controls.
	useEffect(() => {
		if (
			probe.status === "loaded" &&
			probe.element instanceof HTMLVideoElement
		) {
			probe.element.controls = true;
		}
	}, [probe]);

	return (
		<Overlay className={styles.mediaViewer} onClose={onClose} ref={overlayRef}>
			{({ onRequestClose }) => {
				if (
					probe.status === "loaded" &&
					probe.element instanceof HTMLImageElement
				) {
					return (
						<ImageViewer
							containerRef={overlayRef}
							image={probe.element}
							onClose={onRequestClose}
						/>
					);
				}

				return (
					<>
						<Toolbar onClose={onRequestClose} />
						{probe.status === "loading" && <Loader />}
						{probe.status === "failed" && <MediaError />}
						{probe.status === "loaded" && (
							<ElementSlot className={styles.media} element={probe.element} />
						)}
					</>
				);
			}}
		</Overlay>
	);
};
