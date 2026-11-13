import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { findMediaElement } from "./find-media-element";

const CLIP_URL = "https://example.com/clip.mp4";
const OTHER_URL = "https://example.com/other.png";
const PHOTO_URL = "https://example.com/photo.png";
const POINT = { x: 10, y: 20 };

const createImage = (src: string): HTMLImageElement => {
	const image = document.createElement("img");
	image.src = src;
	return image;
};

const createVideo = (src: string): HTMLVideoElement => {
	const video = document.createElement("video");
	video.src = src;
	return video;
};

// jsdom has no layout, so the elements under the point are stubbed.
const elementsFromPoint = vi.fn<(x: number, y: number) => Element[]>(() => []);

// A host with a shadow root that holds the elements under the point.
const createHost = (mode: ShadowRootMode, ...elements: Element[]) => {
	const host = document.createElement("div");
	const root = host.attachShadow({ mode });
	root.append(...elements);
	root.elementsFromPoint = vi.fn(() => elements);

	return { host, root };
};

beforeEach(() => {
	document.elementsFromPoint = elementsFromPoint;
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.clearAllMocks();
});

describe("findMediaElement", () => {
	it("looks under the point in the root", () => {
		findMediaElement(document, POINT, PHOTO_URL);

		expect(elementsFromPoint).toHaveBeenCalledExactlyOnceWith(POINT.x, POINT.y);
	});

	it("looks only in the given root", () => {
		const image = createImage(PHOTO_URL);
		const { root } = createHost("open", image);

		expect(findMediaElement(root, POINT, PHOTO_URL)).toBe(image);
		expect(elementsFromPoint).not.toHaveBeenCalled();
	});

	it("finds the image with the url", () => {
		const image = createImage(PHOTO_URL);

		elementsFromPoint.mockReturnValueOnce([image]);

		expect(findMediaElement(document, POINT, PHOTO_URL)).toBe(image);
	});

	it("finds the video with the url", () => {
		const video = createVideo(CLIP_URL);

		elementsFromPoint.mockReturnValueOnce([video]);

		expect(findMediaElement(document, POINT, CLIP_URL)).toBe(video);
	});

	it("finds the media under an overlay", () => {
		const image = createImage(PHOTO_URL);

		elementsFromPoint.mockReturnValueOnce([
			document.createElement("div"),
			image,
		]);

		expect(findMediaElement(document, POINT, PHOTO_URL)).toBe(image);
	});

	it("finds the image by the source it shows", () => {
		const image = createImage(OTHER_URL);

		// Picked from srcset, and jsdom doesn't pick.
		Object.defineProperty(image, "currentSrc", { value: PHOTO_URL });
		elementsFromPoint.mockReturnValueOnce([image]);

		expect(findMediaElement(document, POINT, PHOTO_URL)).toBe(image);
	});

	it("finds the video by the source it plays", () => {
		const video = document.createElement("video");

		// Picked from the <source> children, and jsdom doesn't pick.
		Object.defineProperty(video, "currentSrc", { value: CLIP_URL });
		elementsFromPoint.mockReturnValueOnce([video]);

		expect(findMediaElement(document, POINT, CLIP_URL)).toBe(video);
	});

	it("skips media with another url", () => {
		const image = createImage(PHOTO_URL);

		elementsFromPoint.mockReturnValueOnce([
			createImage(OTHER_URL),
			createVideo(CLIP_URL),
			image,
		]);

		expect(findMediaElement(document, POINT, PHOTO_URL)).toBe(image);
	});

	// A menu opened from the keyboard reports the center of the focused element,
	// the bottom-left of a selection, or a corner of the viewport.
	it("finds nothing when no media under the point has the url", () => {
		elementsFromPoint.mockReturnValueOnce([
			document.createElement("a"),
			createImage(OTHER_URL),
		]);

		expect(findMediaElement(document, POINT, PHOTO_URL)).toBeNull();
	});

	describe("in a shadow root", () => {
		it("finds the image in an open root, under the same point", () => {
			const image = createImage(PHOTO_URL);
			const { host, root } = createHost("open", image);

			elementsFromPoint.mockReturnValueOnce([host]);

			expect(findMediaElement(document, POINT, PHOTO_URL)).toBe(image);
			expect(root.elementsFromPoint).toHaveBeenCalledExactlyOnceWith(
				POINT.x,
				POINT.y,
			);
		});

		it("finds the image in a closed root through the extension API", () => {
			const image = createImage(PHOTO_URL);
			const { host, root } = createHost("closed", image);

			// jsdom keeps a closed root to itself, like the browser does for a page.
			vi.spyOn(browser.dom, "openOrClosedShadowRoot").mockImplementation(
				(element) => (element === host ? root : null),
			);
			elementsFromPoint.mockReturnValueOnce([host]);

			expect(findMediaElement(document, POINT, PHOTO_URL)).toBe(image);
		});

		it("finds the image in a root inside a root", () => {
			const image = createImage(PHOTO_URL);
			const inner = createHost("open", image);
			const outer = createHost("open", inner.host);

			elementsFromPoint.mockReturnValueOnce([outer.host]);

			expect(findMediaElement(document, POINT, PHOTO_URL)).toBe(image);
		});

		it("goes on with the elements under a host without the media", () => {
			const image = createImage(PHOTO_URL);
			const { host } = createHost("open", createImage(OTHER_URL));

			elementsFromPoint.mockReturnValueOnce([host, image]);

			expect(findMediaElement(document, POINT, PHOTO_URL)).toBe(image);
		});
	});
});
