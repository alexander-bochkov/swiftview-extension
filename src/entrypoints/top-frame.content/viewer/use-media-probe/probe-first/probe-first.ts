import type { MediaCandidate, MediaElement } from "@/shared/types";
import { probeMedia } from "../probe-media";

// Probes the candidates in order and gives the element of the first one that
// loads. Rejects once they've all failed, or with the reason of an abort.
export const probeFirst = async (
	candidates: MediaCandidate[],
	signal: AbortSignal,
): Promise<MediaElement> => {
	for (const candidate of candidates) {
		try {
			return await probeMedia(candidate, signal);
		} catch {
			// After an abort, the next candidate isn't probed.
			signal.throwIfAborted();
		}
	}

	throw new Error("None of the candidates loaded");
};
