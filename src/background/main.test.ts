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
	findBestMediaUrl: vi.fn<() => Promise<string | null>>(() =>
		Promise.resolve(null),
	),
	offerReload: vi.fn(() => Promise.resolve()),
	openMedia: vi.fn<() => Promise<boolean>>(() => Promise.resolve(true)),
	syncMenuWithActiveTab: vi.fn(() => Promise.resolve()),
}));

vi.mock("./utils", () => ({
	findBestMediaUrl: mocks.findBestMediaUrl,
	offerReload: mocks.offerReload,
	openMedia: mocks.openMedia,
	syncMenuWithActiveTab: mocks.syncMenuWithActiveTab,
}));

const BEST_URL = "https://example.com/photo-large.png";
const IFRAME_ID = 5;
const MENU_ITEM_ID = "open-with-swiftview";
const PHOTO_URL = "https://example.com/photo.png";
const TAB_ID = 7;
const WINDOW_ID = 3;
const WINDOW_ID_NONE = -1;

const create = vi.fn<(properties: object, callback: () => void) => void>();
const removeAll = vi.fn(() => Promise.resolve());

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
				id: MENU_ITEM_ID,
				title: "Open with SwiftView",
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
	it("opens the url of the menu", async () => {
		await onClicked(
			{ frameId: 0, menuItemId: MENU_ITEM_ID, srcUrl: PHOTO_URL },
			{ id: TAB_ID },
		);

		expect(mocks.openMedia).toHaveBeenCalledExactlyOnceWith(TAB_ID, PHOTO_URL);
		expect(mocks.offerReload).not.toHaveBeenCalled();
	});

	it("asks the frame of the menu for the best url first", async () => {
		await onClicked(
			{ frameId: IFRAME_ID, menuItemId: MENU_ITEM_ID, srcUrl: PHOTO_URL },
			{ id: TAB_ID },
		);

		expect(mocks.findBestMediaUrl).toHaveBeenCalledExactlyOnceWith(
			TAB_ID,
			IFRAME_ID,
			PHOTO_URL,
		);
		expect(mocks.findBestMediaUrl).toHaveBeenCalledBefore(mocks.openMedia);
	});

	it("asks the top frame when the menu has no frame", async () => {
		await onClicked(
			{ menuItemId: MENU_ITEM_ID, srcUrl: PHOTO_URL },
			{ id: TAB_ID },
		);

		expect(mocks.findBestMediaUrl).toHaveBeenCalledExactlyOnceWith(
			TAB_ID,
			0,
			PHOTO_URL,
		);
	});

	it.each([
		["no", null],
		["an empty", ""],
	])("opens the url of the menu when the frame has %s url", async (_, url) => {
		mocks.findBestMediaUrl.mockResolvedValueOnce(url);

		await onClicked(
			{ frameId: IFRAME_ID, menuItemId: MENU_ITEM_ID, srcUrl: PHOTO_URL },
			{ id: TAB_ID },
		);

		expect(mocks.openMedia).toHaveBeenCalledExactlyOnceWith(TAB_ID, PHOTO_URL);
	});

	it("opens the best url of the frame", async () => {
		mocks.findBestMediaUrl.mockResolvedValueOnce(BEST_URL);

		await onClicked(
			{ frameId: IFRAME_ID, menuItemId: MENU_ITEM_ID, srcUrl: PHOTO_URL },
			{ id: TAB_ID },
		);

		expect(mocks.openMedia).toHaveBeenCalledExactlyOnceWith(TAB_ID, BEST_URL);
	});

	it("offers a reload if the media can't be opened", async () => {
		mocks.openMedia.mockResolvedValueOnce(false);

		await onClicked(
			{ menuItemId: MENU_ITEM_ID, srcUrl: PHOTO_URL },
			{ id: TAB_ID },
		);

		expect(mocks.offerReload).toHaveBeenCalledExactlyOnceWith(TAB_ID);
	});

	it("ignores a click on another menu item", async () => {
		await onClicked({ menuItemId: "other", srcUrl: PHOTO_URL }, { id: TAB_ID });

		expect(mocks.findBestMediaUrl).not.toHaveBeenCalled();
		expect(mocks.openMedia).not.toHaveBeenCalled();
	});

	it("ignores a click without a media url", async () => {
		await onClicked({ menuItemId: MENU_ITEM_ID }, { id: TAB_ID });

		expect(mocks.findBestMediaUrl).not.toHaveBeenCalled();
		expect(mocks.openMedia).not.toHaveBeenCalled();
	});

	it("ignores a click outside a tab", async () => {
		await onClicked({ menuItemId: MENU_ITEM_ID, srcUrl: PHOTO_URL });

		expect(mocks.findBestMediaUrl).not.toHaveBeenCalled();
		expect(mocks.openMedia).not.toHaveBeenCalled();
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
