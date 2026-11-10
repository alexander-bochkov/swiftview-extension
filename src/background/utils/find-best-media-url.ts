import { MESSAGE_TYPE } from "@shared/constants";
import type { FindBestMediaUrlMessage, Nullable } from "@shared/types";

export const findBestMediaUrl = async (
	tabId: number,
	frameId: number,
): Promise<Nullable<string>> => {
	try {
		const response = await browser.tabs.sendMessage<
			FindBestMediaUrlMessage,
			unknown
		>(tabId, { type: MESSAGE_TYPE.FIND_BEST_MEDIA_URL }, { frameId });
		return typeof response === "string" ? response : null;
	} catch {
		return null;
	}
};
