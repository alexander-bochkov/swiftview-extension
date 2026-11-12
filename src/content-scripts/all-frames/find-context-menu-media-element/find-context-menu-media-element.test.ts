import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { findContextMenuMediaElement } from "./find-context-menu-media-element";

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

beforeEach(() => {
	document.elementsFromPoint = elementsFromPoint;
});

afterEach(() => {
	vi.clearAllMocks();
});

describe("findContextMenuMediaElement", () => {
	it("looks under the point of the menu", () => {
		findContextMenuMediaElement(POINT, PHOTO_URL);

		expect(elementsFromPoint).toHaveBeenCalledExactlyOnceWith(POINT.x, POINT.y);
	});

	it("finds the image with the url of the menu", () => {
		const image = createImage(PHOTO_URL);

		elementsFromPoint.mockReturnValueOnce([image]);

		expect(findContextMenuMediaElement(POINT, PHOTO_URL)).toBe(image);
	});

	it("finds the video with the url of the menu", () => {
		const video = createVideo(CLIP_URL);

		elementsFromPoint.mockReturnValueOnce([video]);

		expect(findContextMenuMediaElement(POINT, CLIP_URL)).toBe(video);
	});

	it("finds the media under an overlay", () => {
		const image = createImage(PHOTO_URL);

		elementsFromPoint.mockReturnValueOnce([
			document.createElement("div"),
			image,
		]);

		expect(findContextMenuMediaElement(POINT, PHOTO_URL)).toBe(image);
	});

	it("finds the image by the source it shows", () => {
		const image = createImage(OTHER_URL);

		// Picked from srcset, and jsdom doesn't pick.
		Object.defineProperty(image, "currentSrc", { value: PHOTO_URL });
		elementsFromPoint.mockReturnValueOnce([image]);

		expect(findContextMenuMediaElement(POINT, PHOTO_URL)).toBe(image);
	});

	it("finds the video by the source it plays", () => {
		const video = document.createElement("video");

		// Picked from the <source> children, and jsdom doesn't pick.
		Object.defineProperty(video, "currentSrc", { value: CLIP_URL });
		elementsFromPoint.mockReturnValueOnce([video]);

		expect(findContextMenuMediaElement(POINT, CLIP_URL)).toBe(video);
	});

	it("skips media with another url", () => {
		const image = createImage(PHOTO_URL);

		elementsFromPoint.mockReturnValueOnce([
			createImage(OTHER_URL),
			createVideo(CLIP_URL),
			image,
		]);

		expect(findContextMenuMediaElement(POINT, PHOTO_URL)).toBe(image);
	});

	// A menu opened from the keyboard reports a point near the focused element.
	it("finds nothing when no media under the point has the url", () => {
		elementsFromPoint.mockReturnValueOnce([
			document.createElement("a"),
			createImage(OTHER_URL),
		]);

		expect(findContextMenuMediaElement(POINT, PHOTO_URL)).toBeNull();
	});

	it("finds nothing without a point", () => {
		expect(findContextMenuMediaElement(null, PHOTO_URL)).toBeNull();
		expect(elementsFromPoint).not.toHaveBeenCalled();
	});
});
