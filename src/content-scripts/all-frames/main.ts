import { MESSAGE_TYPE } from "@shared/constants";
import type { ResolveImageUrlMessage } from "@shared/types";
import { ContextMenuTracker } from "./context-menu-tracker";
import { resolveImageUrl } from "./resolve-image-url";

// Runs in every frame, the top one included, as only the frame of the menu has
// the elements under it. Kept small for that reason, the viewer is in the
// script of the top frame.

const contextMenuTracker = new ContextMenuTracker();

// The script runs at document_start, before the scripts of the page.
contextMenuTracker.init();

browser.runtime.onMessage.addListener(
	({ type }: ResolveImageUrlMessage, _, sendResponse) => {
		if (type !== MESSAGE_TYPE.RESOLVE_IMAGE_URL) return;

		sendResponse(resolveImageUrl(contextMenuTracker.point));
	},
);
