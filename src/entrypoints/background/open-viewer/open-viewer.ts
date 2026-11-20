import { sendMessage } from "@/shared/messaging";
import type { MediaCandidate } from "@/shared/types";

export const openViewer = async (
	tabId: number,
	candidates: MediaCandidate[],
): Promise<boolean> => {
	try {
		// The viewer runs only in the top frame, which gives it the whole page,
		// even for media inside iframes.
		await sendMessage("OPEN_VIEWER", candidates, { frameId: 0, tabId });
		return true;
	} catch {
		// No content script in the tab. Chrome adds it only to pages loaded after
		// the extension was installed, updated or enabled.
		return false;
	}
};
