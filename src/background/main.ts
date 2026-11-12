import { MEDIA_TYPE } from "@shared/constants";
import { t } from "@shared/i18n";
import { MENU_ITEM_ID } from "./constants";
import {
	findMediaCandidates,
	isMediaType,
	offerReload,
	openViewer,
	syncMenuWithActiveTab,
} from "./utils";

browser.runtime.onInstalled.addListener(async () => {
	await browser.contextMenus.removeAll();

	browser.contextMenus.create(
		{
			contexts: [MEDIA_TYPE.IMAGE, MEDIA_TYPE.VIDEO],
			id: MENU_ITEM_ID,
			title: t("context_menu@open_with_swiftview"),
		},
		syncMenuWithActiveTab,
	);
});

browser.contextMenus.onClicked.addListener(
	async ({ frameId = 0, mediaType, menuItemId, srcUrl }, tab) => {
		if (
			menuItemId !== MENU_ITEM_ID ||
			!srcUrl ||
			!tab?.id ||
			!isMediaType(mediaType)
		) {
			return;
		}

		const candidates = await findMediaCandidates(tab.id, frameId, {
			type: mediaType,
			url: srcUrl,
		});
		const opened = await openViewer(tab.id, candidates);

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
