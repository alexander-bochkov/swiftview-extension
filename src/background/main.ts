import { MESSAGE_TYPE } from "@shared/constants";
import { t } from "@shared/i18n";
import type { OpenImageMessage } from "@shared/types";

const MENU_ITEM_ID = {
	OPEN_IMAGE: "open-image",
} as const;

chrome.runtime.onInstalled.addListener(async () => {
	await chrome.contextMenus.removeAll();

	// Chrome doesn't run extensions on its own pages, such as settings or the
	// new tab page, so the item is shown only where the content script runs.
	// It still does nothing on web pages where Chrome blocks extensions too:
	// the Chrome Web Store and sites blocked by an enterprise policy.
	const documentUrlPatterns = ["http://*/*", "https://*/*"];

	// The content script runs on local files only if the user allows access
	// to file URLs on the extensions page.
	if (await chrome.extension.isAllowedFileSchemeAccess()) {
		documentUrlPatterns.push("file:///*");
	}

	chrome.contextMenus.create({
		contexts: ["image"],
		documentUrlPatterns,
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
			// No content script in the tab. Chrome adds it only to pages loaded
			// after the extension was installed, updated or enabled, so the item
			// does nothing in pages that were open before, until they're reloaded.
			// To fix it, add the "activeTab" and "scripting" permissions, inject
			// the content script here with chrome.scripting.executeScript (its
			// file is in chrome.runtime.getManifest().content_scripts) and send the
			// message again. The injected script loads its code asynchronously, so
			// the message has to be retried until its listener is ready.
		});
});
