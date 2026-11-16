import { MESSAGE_TYPE } from "@shared/constants";
import type { FindMediaCandidatesMessage, MediaCandidate } from "@shared/types";
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
		const response = await browser.tabs.sendMessage<
			FindMediaCandidatesMessage,
			unknown
		>(
			tabId,
			{ srcUrl: srcCandidate.url, type: MESSAGE_TYPE.FIND_MEDIA_CANDIDATES },
			{ frameId },
		);
		return isMediaCandidateList(response) ? response : [srcCandidate];
	} catch {
		return [srcCandidate];
	}
};
