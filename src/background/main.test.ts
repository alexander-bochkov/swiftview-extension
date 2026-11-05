import { MESSAGE_TYPE } from "@shared/constants";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type ActivatedListener = () => void;

type ClickedListener = (
	info: Partial<chrome.contextMenus.OnClickData>,
	tab?: Partial<chrome.tabs.Tab>,
) => Promise<void>;

type FocusChangedListener = (windowId: number) => void;

type InstalledListener = () => Promise<void>;

type UpdatedListener = (
	tabId: number,
	changeInfo: { status?: string },
	tab: Partial<chrome.tabs.Tab>,
) => void;

const mocks = vi.hoisted(() => ({
	offerReload: vi.fn(() => Promise.resolve()),
	syncMenuWithActiveTab: vi.fn(() => Promise.resolve()),
}));

vi.mock("./utils", () => ({
	offerReload: mocks.offerReload,
	syncMenuWithActiveTab: mocks.syncMenuWithActiveTab,
}));

const OPEN_IMAGE_ID = "open-image";
const PHOTO_URL = "https://example.com/photo.png";
const TAB_ID = 7;
const WINDOW_ID = 3;
const WINDOW_ID_NONE = -1;

const create = vi.fn<(properties: object, callback: () => void) => void>();
const removeAll = vi.fn(() => Promise.resolve());
const sendMessage = vi.fn(() => Promise.resolve());

let onActivated: ActivatedListener;
let onClicked: ClickedListener;
let onFocusChanged: FocusChangedListener;
let onInstalled: InstalledListener;
let onUpdated: UpdatedListener;

// The script registers its listeners on import, so it's imported again for
// every test with fresh stubs.
beforeEach(async () => {
	vi.resetModules();

	vi.stubGlobal("browser", {
		...browser,
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
		tabs: {
			onActivated: {
				addListener: (listener: ActivatedListener) => {
					onActivated = listener;
				},
			},
			onUpdated: {
				addListener: (listener: UpdatedListener) => {
					onUpdated = listener;
				},
			},
			sendMessage,
		},
		windows: {
			onFocusChanged: {
				addListener: (listener: FocusChangedListener) => {
					onFocusChanged = listener;
				},
			},
			WINDOW_ID_NONE,
		},
	});

	await import("./main");
});

afterEach(() => {
	vi.clearAllMocks();
	vi.unstubAllGlobals();
});

describe("on install", () => {
	it("creates a hidden menu item for images", async () => {
		await onInstalled();

		expect(create).toHaveBeenCalledExactlyOnceWith(
			{
				contexts: ["image"],
				id: OPEN_IMAGE_ID,
				title: "Open image with SwiftView",
				visible: false,
			},
			expect.any(Function),
		);
	});

	it("syncs the menu item once it's created", async () => {
		await onInstalled();

		expect(mocks.syncMenuWithActiveTab).not.toHaveBeenCalled();

		create.mock.lastCall?.[1]();

		expect(mocks.syncMenuWithActiveTab).toHaveBeenCalledOnce();
	});

	it("removes the existing menu items first", async () => {
		await onInstalled();

		expect(removeAll).toHaveBeenCalledBefore(create);
	});
});

describe("on menu item click", () => {
	it("sends the image url to the top frame", async () => {
		await onClicked(
			{ menuItemId: OPEN_IMAGE_ID, srcUrl: PHOTO_URL },
			{ id: TAB_ID },
		);

		expect(sendMessage).toHaveBeenCalledExactlyOnceWith(
			TAB_ID,
			{ type: MESSAGE_TYPE.OPEN_IMAGE, url: PHOTO_URL },
			{ frameId: 0 },
		);
		expect(mocks.offerReload).not.toHaveBeenCalled();
	});

	it("offers a reload if the tab has no content script", async () => {
		sendMessage.mockRejectedValueOnce(new Error("No receiving end"));

		await onClicked(
			{ menuItemId: OPEN_IMAGE_ID, srcUrl: PHOTO_URL },
			{ id: TAB_ID },
		);

		expect(mocks.offerReload).toHaveBeenCalledExactlyOnceWith(TAB_ID);
	});

	it("ignores a click on another menu item", async () => {
		await onClicked({ menuItemId: "other", srcUrl: PHOTO_URL }, { id: TAB_ID });

		expect(sendMessage).not.toHaveBeenCalled();
	});

	it("ignores a click without an image url", async () => {
		await onClicked({ menuItemId: OPEN_IMAGE_ID }, { id: TAB_ID });

		expect(sendMessage).not.toHaveBeenCalled();
	});

	it("ignores a click outside a tab", async () => {
		await onClicked({ menuItemId: OPEN_IMAGE_ID, srcUrl: PHOTO_URL });

		expect(sendMessage).not.toHaveBeenCalled();
	});
});

describe("menu item sync", () => {
	it("happens when another tab is activated", () => {
		onActivated();

		expect(mocks.syncMenuWithActiveTab).toHaveBeenCalledOnce();
	});

	it("happens when the loading status of the active tab changes", () => {
		onUpdated(TAB_ID, { status: "complete" }, { active: true });

		expect(mocks.syncMenuWithActiveTab).toHaveBeenCalledOnce();
	});

	it("skips other updates of the active tab", () => {
		onUpdated(TAB_ID, {}, { active: true });

		expect(mocks.syncMenuWithActiveTab).not.toHaveBeenCalled();
	});

	it("skips updates of a background tab", () => {
		onUpdated(TAB_ID, { status: "complete" }, { active: false });

		expect(mocks.syncMenuWithActiveTab).not.toHaveBeenCalled();
	});

	it("happens when another window gets focus", () => {
		onFocusChanged(WINDOW_ID);

		expect(mocks.syncMenuWithActiveTab).toHaveBeenCalledOnce();
	});

	it("skips the focus leaving Chrome", () => {
		onFocusChanged(WINDOW_ID_NONE);

		expect(mocks.syncMenuWithActiveTab).not.toHaveBeenCalled();
	});
});
