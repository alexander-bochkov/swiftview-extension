import { MESSAGE_TYPE } from "@shared/constants";
import type { MediaCandidate, OpenViewerMessage } from "@shared/types";

export const openViewer = async (
	tabId: number,
	candidates: readonly MediaCandidate[],
): Promise<boolean> => {
	try {
		await browser.tabs.sendMessage<OpenViewerMessage>(
			tabId,
			{ candidates, type: MESSAGE_TYPE.OPEN_VIEWER },
			// The viewer runs only in the top frame, which gives it the whole page,
			// even for media inside iframes.
			{ frameId: 0 },
		);
		return true;
	} catch {
		// No content script in the tab. Chrome adds it only to pages loaded after
		// the extension was installed, updated or enabled.
		return false;
	}
};
