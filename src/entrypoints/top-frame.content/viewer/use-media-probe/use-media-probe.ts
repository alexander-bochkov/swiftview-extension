import { useEffect, useState } from "react";
import type { MediaCandidate, MediaElement } from "@/shared/types";
import { probeFirst } from "./probe-first";

export type MediaProbe =
	| Readonly<{ status: "failed" }>
	| Readonly<{ element: MediaElement; status: "loaded" }>
	| Readonly<{ status: "loading" }>;

const FAILED: MediaProbe = { status: "failed" };
const LOADING: MediaProbe = { status: "loading" };

export const useMediaProbe = (candidates: MediaCandidate[]): MediaProbe => {
	const [probe, setProbe] = useState<MediaProbe>(LOADING);

	useEffect(() => {
		const controller = new AbortController();

		setProbe(LOADING);
		probeFirst(candidates, controller.signal).then(
			(element) => setProbe({ element, status: "loaded" }),
			() => {
				// Aborted by the cleanup, which isn't a failure.
				if (!controller.signal.aborted) setProbe(FAILED);
			},
		);

		return () => controller.abort();
	}, [candidates]);

	return probe;
};
