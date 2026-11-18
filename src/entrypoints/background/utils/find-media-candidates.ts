import { sendMessage } from "@/shared/messaging";
import type { MediaCandidate } from "@/shared/types";

export const findMediaCandidates = async (
	tabId: number,
	frameId: number,
	srcCandidate: MediaCandidate,
): Promise<readonly MediaCandidate[]> => {
	try {
		const response = await sendMessage(
			"FIND_MEDIA_CANDIDATES",
			srcCandidate.url,
			{ frameId, tabId },
		);
		return response ?? [srcCandidate];
	} catch {
		return [srcCandidate];
	}
};
