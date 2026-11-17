import { sendMessage } from "@/shared/messaging";
import type { MediaCandidate } from "@/shared/types";
import { isMediaType } from "./is-media-type";

const isMediaCandidate = (value: unknown): value is MediaCandidate =>
	!!value &&
	typeof value === "object" &&
	"type" in value &&
	"url" in value &&
	isMediaType(value.type) &&
	typeof value.url === "string";

const isMediaCandidateList = (value: unknown): value is MediaCandidate[] =>
	Array.isArray(value) && value.length > 0 && value.every(isMediaCandidate);

export const findMediaCandidates = async (
	tabId: number,
	frameId: number,
	srcCandidate: MediaCandidate,
): Promise<readonly MediaCandidate[]> => {
	try {
		const response = await sendMessage(
			"findMediaCandidates",
			srcCandidate.url,
			{ frameId, tabId },
		);
		// Checked despite its type: a content script left from an older version
		// of the extension can answer in another shape.
		return isMediaCandidateList(response) ? response : [srcCandidate];
	} catch {
		return [srcCandidate];
	}
};
