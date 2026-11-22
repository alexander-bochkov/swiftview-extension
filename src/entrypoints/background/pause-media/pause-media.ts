import { sendMessage } from "@/shared/messaging";

export const pauseMedia = async (
	tabId: number,
	frameId: number,
): Promise<void> => {
	try {
		await sendMessage("PAUSE_MEDIA", undefined, { frameId, tabId });
	} catch {
		// The frame was removed or navigated away in the meantime.
	}
};
