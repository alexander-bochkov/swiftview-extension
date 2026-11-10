import { MESSAGE_TYPE } from "@shared/constants";
import type { Nullable, ResolveImageUrlMessage } from "@shared/types";

// Asks the frame of the menu for a better url of the image, as only it has the
// elements under the point where the menu was opened. Null when it has none,
// or has no script to answer, e.g. a frame loaded before the extension was
// installed, or one Chrome doesn't run scripts in. The url of the menu is used
// then.
export const requestImageUrl = async (
	tabId: number,
	frameId: number,
): Promise<Nullable<string>> => {
	try {
		const response = await browser.tabs.sendMessage<
			ResolveImageUrlMessage,
			unknown
		>(tabId, { type: MESSAGE_TYPE.RESOLVE_IMAGE_URL }, { frameId });
		return typeof response === "string" ? response : null;
	} catch {
		return null;
	}
};
