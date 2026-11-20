import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MEDIA_TYPE } from "@/shared/constants";
import type { MediaCandidate } from "@/shared/types";
import background from "./index";

type ClickedListener = (
	info: Partial<Browser.contextMenus.OnClickData>,
	tab?: Partial<Browser.tabs.Tab>,
) => Promise<void>;

const mocks = vi.hoisted(() => ({
	findMediaCandidates: vi.fn<() => Promise<readonly MediaCandidate[]>>(() =>
		Promise.resolve([]),
	),
	offerReload: vi.fn(() => Promise.resolve()),
	openExtensionSettings: vi.fn(() => Promise.resolve()),
	openViewer: vi.fn<() => Promise<boolean>>(() => Promise.resolve(true)),
	shouldAskForFileAccess: vi.fn(() => Promise.resolve(false)),
	syncMenuWithActiveTab: vi.fn(() => Promise.resolve()),
}));

// Only the helpers that reach outside the script are mocked.
vi.mock("./utils", async (importOriginal) => ({
	...(await importOriginal<typeof import("./utils")>()),
	findMediaCandidates: mocks.findMediaCandidates,
	offerReload: mocks.offerReload,
	openExtensionSettings: mocks.openExtensionSettings,
	openViewer: mocks.openViewer,
	shouldAskForFileAccess: mocks.shouldAskForFileAccess,
	syncMenuWithActiveTab: mocks.syncMenuWithActiveTab,
}));

const LARGE_URL = "https://example.com/photo-large.png";
const CLIP_URL = "https://example.com/clip.mp4";
const FILE_URL = "file:///C:/photos/index.html";
const IFRAME_ID = 5;
const MENU_ITEM_ID = "media";
const PHOTO_URL = "https://example.com/photo.png";
const TAB_ID = 7;
const WINDOW_ID = 3;
const WINDOW_ID_NONE = -1;

const LARGE = { type: MEDIA_TYPE.IMAGE, url: LARGE_URL };
const CLIP = { type: MEDIA_TYPE.VIDEO, url: CLIP_URL };
const PHOTO = { type: MEDIA_TYPE.IMAGE, url: PHOTO_URL };

const PHOTO_CLICK = {
	frameId: 0,
	mediaType: MEDIA_TYPE.IMAGE,
	menuItemId: MENU_ITEM_ID,
	srcUrl: PHOTO_URL,
} as const;

const create = vi
	.spyOn(fakeBrowser.contextMenus, "create")
	.mockReturnValue(MENU_ITEM_ID);
const removeAll = vi
	.spyOn(fakeBrowser.contextMenus, "removeAll")
	.mockResolvedValue(undefined);

// The fake browser doesn't implement the menu's events, so the listener is
// kept to be called directly.
let onClicked: ClickedListener;

vi.spyOn(fakeBrowser.contextMenus.onClicked, "addListener").mockImplementation(
	(listener) => {
		onClicked = listener as unknown as ClickedListener;
	},
);

const onActivated = () =>
	fakeBrowser.tabs.onActivated.trigger({ tabId: TAB_ID, windowId: WINDOW_ID });

const onFocusChanged = (windowId: number) =>
	fakeBrowser.windows.onFocusChanged.trigger(windowId);

const onInstalled = () =>
	fakeBrowser.runtime.onInstalled.trigger({
		reason: "install",
	} as Browser.runtime.InstalledDetails);

const onUpdated = (
	tabId: number,
	changeInfo: Browser.tabs.OnUpdatedInfo,
	tab: Partial<Browser.tabs.Tab>,
) =>
	fakeBrowser.tabs.onUpdated.trigger(
		tabId,
		changeInfo,
		tab as Browser.tabs.Tab,
	);

// The listeners are registered again for every test, on a fresh fake browser.
beforeEach(() => {
	fakeBrowser.reset();
	background.main();
});

afterEach(() => {
	vi.clearAllMocks();
});

describe("on install", () => {
	it("creates the menu item for images and videos", async () => {
		await onInstalled();

		expect(create).toHaveBeenCalledExactlyOnceWith(
			{
				contexts: [MEDIA_TYPE.IMAGE, MEDIA_TYPE.VIDEO],
				id: MENU_ITEM_ID,
				title: "Open with SwiftView",
			},
			expect.any(Function),
		);
	});

	it("syncs the menu item once it's created", async () => {
		await onInstalled();

		expect(mocks.syncMenuWithActiveTab).not.toHaveBeenCalled();

		create.mock.lastCall?.[1]?.();

		expect(mocks.syncMenuWithActiveTab).toHaveBeenCalledOnce();
	});

	it("removes the existing menu items first", async () => {
		await onInstalled();

		expect(removeAll).toHaveBeenCalledBefore(create);
	});
});

describe("on menu item click", () => {
	it("asks the frame of the menu for the candidates of the image", async () => {
		await onClicked({ ...PHOTO_CLICK, frameId: IFRAME_ID }, { id: TAB_ID });

		expect(mocks.findMediaCandidates).toHaveBeenCalledExactlyOnceWith(
			TAB_ID,
			IFRAME_ID,
			PHOTO,
		);
	});

	it("asks the frame of the menu for the candidates of the video", async () => {
		await onClicked(
			{ ...PHOTO_CLICK, mediaType: MEDIA_TYPE.VIDEO, srcUrl: CLIP_URL },
			{ id: TAB_ID },
		);

		expect(mocks.findMediaCandidates).toHaveBeenCalledExactlyOnceWith(
			TAB_ID,
			0,
			CLIP,
		);
	});

	it("asks the top frame when the menu reports no frame", async () => {
		await onClicked({ ...PHOTO_CLICK, frameId: undefined }, { id: TAB_ID });

		expect(mocks.findMediaCandidates).toHaveBeenCalledExactlyOnceWith(
			TAB_ID,
			0,
			PHOTO,
		);
	});

	it("opens the candidates", async () => {
		mocks.findMediaCandidates.mockResolvedValueOnce([LARGE, PHOTO]);

		await onClicked(PHOTO_CLICK, { id: TAB_ID });

		expect(mocks.findMediaCandidates).toHaveBeenCalledBefore(mocks.openViewer);
		expect(mocks.openViewer).toHaveBeenCalledExactlyOnceWith(TAB_ID, [
			LARGE,
			PHOTO,
		]);
		expect(mocks.offerReload).not.toHaveBeenCalled();
	});

	it("offers to reload the page without a content script", async () => {
		mocks.openViewer.mockResolvedValueOnce(false);

		await onClicked(PHOTO_CLICK, { id: TAB_ID });

		expect(mocks.offerReload).toHaveBeenCalledExactlyOnceWith(TAB_ID);
	});

	it("opens the extension settings on a local file the extension can't access", async () => {
		mocks.shouldAskForFileAccess.mockResolvedValueOnce(true);

		await onClicked(PHOTO_CLICK, { id: TAB_ID, url: FILE_URL });

		expect(mocks.shouldAskForFileAccess).toHaveBeenCalledExactlyOnceWith(
			FILE_URL,
		);
		expect(mocks.openExtensionSettings).toHaveBeenCalledOnce();
		expect(mocks.findMediaCandidates).not.toHaveBeenCalled();
		expect(mocks.openViewer).not.toHaveBeenCalled();
	});

	it("ignores a click on another menu item", async () => {
		await onClicked({ ...PHOTO_CLICK, menuItemId: "other" }, { id: TAB_ID });

		expect(mocks.findMediaCandidates).not.toHaveBeenCalled();
		expect(mocks.openExtensionSettings).not.toHaveBeenCalled();
		expect(mocks.openViewer).not.toHaveBeenCalled();
	});

	it("ignores a click without a url", async () => {
		await onClicked({ ...PHOTO_CLICK, srcUrl: undefined }, { id: TAB_ID });

		expect(mocks.openViewer).not.toHaveBeenCalled();
	});

	it("ignores a click without a tab", async () => {
		await onClicked(PHOTO_CLICK);

		expect(mocks.openViewer).not.toHaveBeenCalled();
	});

	it.each([undefined, "audio" as const])(
		"ignores a click on media of the type %s",
		async (mediaType) => {
			await onClicked({ ...PHOTO_CLICK, mediaType }, { id: TAB_ID });

			expect(mocks.openViewer).not.toHaveBeenCalled();
		},
	);
});

describe("on tab activated", () => {
	it("syncs the menu item", () => {
		onActivated();

		expect(mocks.syncMenuWithActiveTab).toHaveBeenCalledOnce();
	});
});

describe("on tab updated", () => {
	it("syncs the menu item when the active tab loads", () => {
		onUpdated(TAB_ID, { status: "loading" }, { active: true });

		expect(mocks.syncMenuWithActiveTab).toHaveBeenCalledOnce();
	});

	it("ignores an inactive tab", () => {
		onUpdated(TAB_ID, { status: "loading" }, { active: false });

		expect(mocks.syncMenuWithActiveTab).not.toHaveBeenCalled();
	});

	it("ignores a change other than the status", () => {
		onUpdated(TAB_ID, {}, { active: true });

		expect(mocks.syncMenuWithActiveTab).not.toHaveBeenCalled();
	});
});

describe("on window focus changed", () => {
	it("syncs the menu item", () => {
		onFocusChanged(WINDOW_ID);

		expect(mocks.syncMenuWithActiveTab).toHaveBeenCalledOnce();
	});

	it("ignores the loss of focus", () => {
		onFocusChanged(WINDOW_ID_NONE);

		expect(mocks.syncMenuWithActiveTab).not.toHaveBeenCalled();
	});
});
