import { t } from "@shared/i18n";
import { MENU_ITEM_ID } from "./constants";
import {
	findBestMediaUrl,
	offerReload,
	openMedia,
	syncMenuWithActiveTab,
} from "./utils";

browser.runtime.onInstalled.addListener(async () => {
	await browser.contextMenus.removeAll();

	browser.contextMenus.create(
		{
			contexts: ["image"],
			id: MENU_ITEM_ID,
			title: t("context_menu@open_with_swiftview"),
			visible: false,
		},
		syncMenuWithActiveTab,
	);
});

browser.contextMenus.onClicked.addListener(
	async ({ frameId = 0, menuItemId, srcUrl }, tab) => {
		if (menuItemId !== MENU_ITEM_ID || !srcUrl || !tab?.id) return;

		const bestUrl = await findBestMediaUrl(tab.id, frameId, srcUrl);
		const opened = await openMedia(tab.id, bestUrl || srcUrl);

		if (!opened) await offerReload(tab.id);
	},
);

browser.tabs.onActivated.addListener(syncMenuWithActiveTab);

browser.tabs.onUpdated.addListener((_, { status }, { active }) => {
	if (status && active) syncMenuWithActiveTab();
});

browser.windows.onFocusChanged.addListener((windowId) => {
	if (windowId !== browser.windows.WINDOW_ID_NONE) syncMenuWithActiveTab();
});
