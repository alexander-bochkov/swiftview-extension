import { sendMessage } from "@/shared/messaging";
import type { MediaCandidate } from "@/shared/types";

// "already-open" when the viewer is open, "unreachable" without a content
// script in the top frame.
export type OpenResult = "already-open" | "opened" | "unreachable";

export const openViewer = async (
	tabId: number,
	candidates: MediaCandidate[],
): Promise<OpenResult> => {
	try {
		// The viewer runs only in the top frame, which gives it the whole page,
		// even for media inside iframes.
		const opened = await sendMessage("OPEN_VIEWER", candidates, {
			frameId: 0,
			tabId,
		});

		return opened ? "opened" : "already-open";
	} catch {
		// Chrome adds the script only to pages loaded after the extension was
		// installed, updated or enabled.
		return "unreachable";
	}
};
