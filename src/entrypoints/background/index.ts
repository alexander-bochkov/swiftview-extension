import { MEDIA_TYPE } from "@/shared/constants";
import { MENU_ITEM_ID } from "./constants";
import { findMediaCandidates } from "./find-media-candidates";
import { isMediaType } from "./is-media-type";
import { offerReload } from "./offer-reload";
import { openExtensionSettings } from "./open-extension-settings";
import { openViewer } from "./open-viewer";
import { shouldAskForFileAccess } from "./should-ask-for-file-access";
import { syncMenuWithActiveTab } from "./sync-menu-with-active-tab";

export default defineBackground({
	main() {
		browser.runtime.onInstalled.addListener(async () => {
			await browser.contextMenus.removeAll();

			browser.contextMenus.create(
				{
					contexts: [MEDIA_TYPE.IMAGE, MEDIA_TYPE.VIDEO],
					id: MENU_ITEM_ID,
					title: browser.i18n.getMessage("context_menu@open_with_swiftview"),
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

				if (await shouldAskForFileAccess(tab.url)) {
					await openExtensionSettings();
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
	},
	type: "module",
});
