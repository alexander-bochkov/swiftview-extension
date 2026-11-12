import { MEDIA_TYPE } from "@shared/constants";
import type { MediaCandidate } from "@shared/types";
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
	findMediaCandidates: vi.fn<() => Promise<readonly MediaCandidate[]>>(() =>
		Promise.resolve([]),
	),
	offerReload: vi.fn(() => Promise.resolve()),
	openViewer: vi.fn<() => Promise<boolean>>(() => Promise.resolve(true)),
	syncMenuWithActiveTab: vi.fn(() => Promise.resolve()),
}));

// Only the helpers that reach outside the script are mocked.
vi.mock("./utils", async (importOriginal) => ({
	...(await importOriginal<typeof import("./utils")>()),
	findMediaCandidates: mocks.findMediaCandidates,
	offerReload: mocks.offerReload,
	openViewer: mocks.openViewer,
	syncMenuWithActiveTab: mocks.syncMenuWithActiveTab,
}));

const BEST_URL = "https://example.com/photo-large.png";
const CLIP_URL = "https://example.com/clip.mp4";
const IFRAME_ID = 5;
const MENU_ITEM_ID = "open-with-swiftview";
const PHOTO_URL = "https://example.com/photo.png";
const TAB_ID = 7;
const WINDOW_ID = 3;
const WINDOW_ID_NONE = -1;

const BEST = { type: MEDIA_TYPE.IMAGE, url: BEST_URL };
const CLIP = { type: MEDIA_TYPE.VIDEO, url: CLIP_URL };
const PHOTO = { type: MEDIA_TYPE.IMAGE, url: PHOTO_URL };

const PHOTO_CLICK = {
	frameId: 0,
	mediaType: MEDIA_TYPE.IMAGE,
	menuItemId: MENU_ITEM_ID,
	srcUrl: PHOTO_URL,
} as const;

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

		create.mock.lastCall?.[1]();

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
		mocks.findMediaCandidates.mockResolvedValueOnce([BEST, PHOTO]);

		await onClicked(PHOTO_CLICK, { id: TAB_ID });

		expect(mocks.findMediaCandidates).toHaveBeenCalledBefore(mocks.openViewer);
		expect(mocks.openViewer).toHaveBeenCalledExactlyOnceWith(TAB_ID, [
			BEST,
			PHOTO,
		]);
		expect(mocks.offerReload).not.toHaveBeenCalled();
	});

	it("offers to reload the page without a content script", async () => {
		mocks.openViewer.mockResolvedValueOnce(false);

		await onClicked(PHOTO_CLICK, { id: TAB_ID });

		expect(mocks.offerReload).toHaveBeenCalledExactlyOnceWith(TAB_ID);
	});

	it("ignores a click on another menu item", async () => {
		await onClicked({ ...PHOTO_CLICK, menuItemId: "other" }, { id: TAB_ID });

		expect(mocks.findMediaCandidates).not.toHaveBeenCalled();
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
