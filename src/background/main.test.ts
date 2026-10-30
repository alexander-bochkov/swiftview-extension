import { MESSAGE_TYPE } from "@shared/constants";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type InstalledListener = () => Promise<void>;

type ClickedListener = (
	info: Partial<chrome.contextMenus.OnClickData>,
	tab?: Partial<chrome.tabs.Tab>,
) => void;

const OPEN_IMAGE_ID = "open-image";
const PHOTO_URL = "https://example.com/photo.png";
const TAB_ID = 7;

const create = vi.fn();
const removeAll = vi.fn(() => Promise.resolve());
const sendMessage = vi.fn(() => Promise.resolve());

let onClicked: ClickedListener;
let onInstalled: InstalledListener;

// The script registers its listeners on import, so it's imported again for
// every test with fresh stubs.
beforeEach(async () => {
	vi.resetModules();

	vi.stubGlobal("chrome", {
		...chrome,
		contextMenus: {
			create,
			onClicked: {
				addListener: (listener: ClickedListener) => {
					onClicked = listener;
				},
			},
			removeAll,
		},
		runtime: {
			onInstalled: {
				addListener: (listener: InstalledListener) => {
					onInstalled = listener;
				},
			},
		},
		tabs: { sendMessage },
	});

	await import("./main");
});

afterEach(() => {
	vi.clearAllMocks();
	vi.unstubAllGlobals();
});

describe("on install", () => {
	it("creates the menu item for images on web and file pages", async () => {
		await onInstalled();

		expect(create).toHaveBeenCalledExactlyOnceWith({
			contexts: ["image"],
			documentUrlPatterns: ["file:///*", "http://*/*", "https://*/*"],
			id: OPEN_IMAGE_ID,
			title: "Open image with SwiftView",
		});
	});

	it("removes the existing menu items first", async () => {
		await onInstalled();

		expect(removeAll).toHaveBeenCalledBefore(create);
	});
});

describe("on menu item click", () => {
	it("sends the image url to the top frame", () => {
		onClicked({ menuItemId: OPEN_IMAGE_ID, srcUrl: PHOTO_URL }, { id: TAB_ID });

		expect(sendMessage).toHaveBeenCalledExactlyOnceWith(
			TAB_ID,
			{ type: MESSAGE_TYPE.OPEN_IMAGE, url: PHOTO_URL },
			{ frameId: 0 },
		);
	});

	it("ignores a click on another menu item", () => {
		onClicked({ menuItemId: "other", srcUrl: PHOTO_URL }, { id: TAB_ID });

		expect(sendMessage).not.toHaveBeenCalled();
	});

	it("ignores a click without an image url", () => {
		onClicked({ menuItemId: OPEN_IMAGE_ID }, { id: TAB_ID });

		expect(sendMessage).not.toHaveBeenCalled();
	});

	it("ignores a click outside a tab", () => {
		onClicked({ menuItemId: OPEN_IMAGE_ID, srcUrl: PHOTO_URL });

		expect(sendMessage).not.toHaveBeenCalled();
	});
});
