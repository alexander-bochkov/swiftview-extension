import { MESSAGE_TYPE } from "@shared/constants";
import type { OpenMediaMessage } from "@shared/types";

export const openMedia = async (
	tabId: number,
	url: string,
): Promise<boolean> => {
	try {
		await browser.tabs.sendMessage<OpenMediaMessage>(
			tabId,
			{ type: MESSAGE_TYPE.OPEN_MEDIA, url },
			// The viewer runs only in the top frame, which gives it the whole page,
			// even for images inside iframes.
			{ frameId: 0 },
		);
		return true;
	} catch {
		// No content script in the tab. Chrome adds it only to pages loaded after
		// the extension was installed, updated or enabled.
		return false;
	}
};
