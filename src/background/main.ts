import { MESSAGE_TYPE } from "@shared/constants";
import { t } from "@shared/i18n";
import type { OpenImageMessage } from "@shared/types";
import { MENU_ITEM_ID } from "./constants";
import { offerReload, requestImageUrl, syncMenuWithActiveTab } from "./utils";

browser.runtime.onInstalled.addListener(async () => {
	await browser.contextMenus.removeAll();

	browser.contextMenus.create(
		{
			contexts: ["image"],
			id: MENU_ITEM_ID,
			title: t("context_menu@open_image"),
			visible: false,
		},
		syncMenuWithActiveTab,
	);
});

browser.contextMenus.onClicked.addListener(
	async ({ frameId = 0, menuItemId, srcUrl }, tab) => {
		if (menuItemId !== MENU_ITEM_ID || !srcUrl || !tab?.id) return;

		const url = await requestImageUrl(tab.id, frameId);

		try {
			await browser.tabs.sendMessage<OpenImageMessage>(
				tab.id,
				{ type: MESSAGE_TYPE.OPEN_IMAGE, url: url || srcUrl },
				// The viewer runs only in the top frame, which gives it the whole page,
				// even for images inside iframes.
				{ frameId: 0 },
			);
		} catch {
			// No content script in the tab. Chrome adds it only to pages loaded after
			// the extension was installed, updated or enabled.
			await offerReload(tab.id);
		}
	},
);

browser.tabs.onActivated.addListener(syncMenuWithActiveTab);

browser.tabs.onUpdated.addListener((_, { status }, { active }) => {
	if (status && active) syncMenuWithActiveTab();
});

browser.windows.onFocusChanged.addListener((windowId) => {
	if (windowId !== browser.windows.WINDOW_ID_NONE) syncMenuWithActiveTab();
});
