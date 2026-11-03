import { MESSAGE_TYPE } from "@shared/constants";
import { t } from "@shared/i18n";
import type { OpenImageMessage } from "@shared/types";
import { MENU_ITEM_ID } from "./constants";
import { offerReload, syncMenuWithActiveTab } from "./utils";

chrome.runtime.onInstalled.addListener(async () => {
	await chrome.contextMenus.removeAll();

	chrome.contextMenus.create(
		{
			contexts: ["image"],
			id: MENU_ITEM_ID.OPEN_IMAGE,
			title: t("context_menu@open_image"),
			visible: false,
		},
		syncMenuWithActiveTab,
	);
});

chrome.contextMenus.onClicked.addListener(
	async ({ menuItemId, srcUrl }, tab) => {
		if (menuItemId !== MENU_ITEM_ID.OPEN_IMAGE || !srcUrl || !tab?.id) return;

		try {
			await chrome.tabs.sendMessage<OpenImageMessage>(
				tab.id,
				{ type: MESSAGE_TYPE.OPEN_IMAGE, url: srcUrl },
				// The content script runs only in the top frame, which gives the viewer
				// the whole page, even for images inside iframes.
				{ frameId: 0 },
			);
		} catch {
			// No content script in the tab. Chrome adds it only to pages loaded after
			// the extension was installed, updated or enabled.
			await offerReload(tab.id);
		}
	},
);

chrome.tabs.onActivated.addListener(syncMenuWithActiveTab);

chrome.tabs.onUpdated.addListener((_, { status }, { active }) => {
	if (status && active) syncMenuWithActiveTab();
});

chrome.windows.onFocusChanged.addListener((windowId) => {
	if (windowId !== chrome.windows.WINDOW_ID_NONE) syncMenuWithActiveTab();
});
