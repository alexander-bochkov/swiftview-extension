import { MESSAGE_TYPE } from "@shared/constants";
import { t } from "@shared/i18n";
import type { OpenImageMessage } from "@shared/types";

const MENU_ITEM_ID = {
	OPEN_IMAGE: "open-image",
} as const;

chrome.runtime.onInstalled.addListener(async () => {
	await chrome.contextMenus.removeAll();

	chrome.contextMenus.create({
		contexts: ["image"],
		id: MENU_ITEM_ID.OPEN_IMAGE,
		title: t("context_menu@open_image"),
	});
});

chrome.contextMenus.onClicked.addListener(({ menuItemId, srcUrl }, tab) => {
	if (menuItemId !== MENU_ITEM_ID.OPEN_IMAGE || !srcUrl || !tab?.id) return;

	chrome.tabs
		.sendMessage<OpenImageMessage>(
			tab.id,
			{ type: MESSAGE_TYPE.OPEN_IMAGE, url: srcUrl },
			// The content script runs only in the top frame, which gives the viewer
			// the whole page, even for images inside iframes.
			{ frameId: 0 },
		)
		.catch(() => {
			// No content script in the tab, e.g. it was open before the install.
		});
});
