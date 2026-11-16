import type { MediaCandidate, MediaElement } from "@shared/types";
import { useEffect, useState } from "react";
import { probeMedia } from "./probe-media";

export type MediaProbe =
	| Readonly<{ status: "failed" }>
	| Readonly<{ element: MediaElement; status: "loaded" }>
	| Readonly<{ status: "loading" }>;

const FAILED: MediaProbe = { status: "failed" };
const LOADING: MediaProbe = { status: "loading" };

export const useMediaProbe = (
	candidates: readonly MediaCandidate[],
): MediaProbe => {
	const [probe, setProbe] = useState<MediaProbe>(LOADING);

	useEffect(() => {
		const controller = new AbortController();
		const { signal } = controller;

		const run = async (): Promise<void> => {
			for (const candidate of candidates) {
				try {
					const element = await probeMedia(candidate, signal);
					setProbe({ element, status: "loaded" });

					return;
				} catch {
					if (signal.aborted) return;
				}
			}

			setProbe(FAILED);
		};

		setProbe(LOADING);
		void run();

		return () => controller.abort();
	}, [candidates]);

	return probe;
};
