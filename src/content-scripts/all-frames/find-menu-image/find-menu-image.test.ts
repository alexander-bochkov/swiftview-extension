import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { findMenuImage } from "./find-menu-image";

const OTHER_URL = "https://example.com/other.png";
const PHOTO_URL = "https://example.com/photo.png";
const POINT = { x: 10, y: 20 };

const createImage = (src: string): HTMLImageElement => {
	const image = document.createElement("img");
	image.src = src;
	return image;
};

// jsdom has no layout, so the elements under the point are stubbed.
const elementsFromPoint = vi.fn<(x: number, y: number) => Element[]>(() => []);

beforeEach(() => {
	document.elementsFromPoint = elementsFromPoint;
});

afterEach(() => {
	vi.clearAllMocks();
});

describe("findMenuImage", () => {
	it("looks under the point of the menu", () => {
		findMenuImage(POINT, PHOTO_URL);

		expect(elementsFromPoint).toHaveBeenCalledExactlyOnceWith(POINT.x, POINT.y);
	});

	it("finds the image with the url of the menu", () => {
		const image = createImage(PHOTO_URL);

		elementsFromPoint.mockReturnValueOnce([image]);

		expect(findMenuImage(POINT, PHOTO_URL)).toBe(image);
	});

	it("finds the image under an overlay", () => {
		const image = createImage(PHOTO_URL);

		elementsFromPoint.mockReturnValueOnce([
			document.createElement("div"),
			image,
		]);

		expect(findMenuImage(POINT, PHOTO_URL)).toBe(image);
	});

	it("finds the image by the source it shows", () => {
		const image = createImage(OTHER_URL);

		// Picked from srcset, and jsdom doesn't pick.
		Object.defineProperty(image, "currentSrc", { value: PHOTO_URL });
		elementsFromPoint.mockReturnValueOnce([image]);

		expect(findMenuImage(POINT, PHOTO_URL)).toBe(image);
	});

	it("skips an image with another url", () => {
		const image = createImage(PHOTO_URL);

		elementsFromPoint.mockReturnValueOnce([createImage(OTHER_URL), image]);

		expect(findMenuImage(POINT, PHOTO_URL)).toBe(image);
	});

	// A menu opened from the keyboard reports a point near the focused element.
	it("finds nothing when no image under the point has the url", () => {
		elementsFromPoint.mockReturnValueOnce([
			document.createElement("a"),
			createImage(OTHER_URL),
		]);

		expect(findMenuImage(POINT, PHOTO_URL)).toBeNull();
	});

	it("finds nothing without a point", () => {
		expect(findMenuImage(null, PHOTO_URL)).toBeNull();
		expect(elementsFromPoint).not.toHaveBeenCalled();
	});
});
