import { MEDIA_TYPE } from "@shared/constants";
import { describe, expect, it } from "vitest";
import { findBestImage } from "./find-best-image";

type ImageInit = {
	currentSrc?: string;
	src?: string;
	srcset?: string;
};

const resolve = (url: string) => new URL(url, document.baseURI).href;

const createImage = ({
	currentSrc = "",
	src = "",
	srcset = "",
}: ImageInit = {}) => {
	const image = document.createElement("img");

	// jsdom doesn't load images, so it never sets the current source.
	Object.defineProperty(image, "currentSrc", { value: currentSrc });

	if (src) image.src = src;
	if (srcset) image.srcset = srcset;

	return image;
};

const createPicture = (...children: Element[]) => {
	const picture = document.createElement("picture");
	picture.append(...children);

	return picture;
};

const createSource = (srcset: string) => {
	const source = document.createElement("source");
	source.srcset = srcset;

	return source;
};

describe("findBestImage", () => {
	describe("srcset", () => {
		it.each([
			[
				"width descriptors",
				"https://example.com/a-480.jpg 480w, https://example.com/a-1600.jpg 1600w, https://example.com/a-800.jpg 800w",
				"https://example.com/a-1600.jpg",
			],
			[
				"density descriptors",
				"https://example.com/a.jpg 1x, https://example.com/a-3x.jpg 3x, https://example.com/a-2x.jpg 2x",
				"https://example.com/a-3x.jpg",
			],
			[
				"decimal descriptors",
				"https://example.com/a.jpg 2.5x, https://example.com/b.jpg 2x",
				"https://example.com/a.jpg",
			],
			[
				"a candidate without a descriptor (1x) against a larger one",
				"https://example.com/a.jpg, https://example.com/b.jpg 2x",
				"https://example.com/b.jpg",
			],
			[
				"a candidate without a descriptor (1x) against a smaller one",
				"https://example.com/a.jpg, https://example.com/b.jpg 0.5x",
				"https://example.com/a.jpg",
			],
			[
				"an unknown descriptor, counted as 1x",
				"https://example.com/a.jpg 100h, https://example.com/b.jpg 2x",
				"https://example.com/b.jpg",
			],
			[
				"equal sizes, where the first wins",
				"https://example.com/a.jpg 1x, https://example.com/b.jpg 1x",
				"https://example.com/a.jpg",
			],
			[
				"urls with commas",
				"https://example.com/w_100,h_100/a.jpg 1x, https://example.com/w_200,h_200/a.jpg 2x",
				"https://example.com/w_200,h_200/a.jpg",
			],
			[
				"extra whitespace and line breaks",
				"https://example.com/a.jpg 1x,\n   https://example.com/b.jpg   2x\n",
				"https://example.com/b.jpg",
			],
		])("picks the largest candidate: %s", (_, srcset, expected) => {
			expect(findBestImage(createImage({ srcset }))?.url).toBe(expected);
		});

		it("prefers the srcset over src and currentSrc", () => {
			const image = createImage({
				currentSrc: "https://example.com/current.jpg",
				src: "https://example.com/src.jpg",
				srcset: "https://example.com/a.jpg 1x, https://example.com/b.jpg 2x",
			});

			expect(findBestImage(image)).toEqual({
				type: MEDIA_TYPE.IMAGE,
				url: "https://example.com/b.jpg",
			});
		});

		it("resolves a relative candidate against the document", () => {
			const image = createImage({ srcset: "a.jpg 1x, b.jpg 2x" });

			expect(findBestImage(image)?.url).toBe(resolve("b.jpg"));
		});

		it("finds nothing for a candidate with an invalid url", () => {
			const image = createImage({ srcset: "http://[invalid 2x" });

			expect(findBestImage(image)).toBeNull();
		});

		it("skips a candidate with an invalid url for the next largest", () => {
			const image = createImage({ srcset: "http://[invalid 3x, b.jpg 2x" });

			expect(findBestImage(image)?.url).toBe(resolve("b.jpg"));
		});
	});

	describe("without a srcset", () => {
		it("finds nothing, as the image shows its only url", () => {
			const image = createImage({
				currentSrc: "https://example.com/current.jpg",
				src: "https://example.com/src.jpg",
			});

			expect(findBestImage(image)).toBeNull();
		});

		it("finds nothing for an image without any source", () => {
			expect(findBestImage(createImage())).toBeNull();
		});
	});

	describe("inside a picture", () => {
		it("reads the srcset of the source the browser chose", () => {
			const image = createImage({
				currentSrc: "https://example.com/photo-800.avif",
				src: "https://example.com/photo-800.jpg",
			});
			createPicture(
				createSource(
					"https://example.com/photo-800.avif 800w, https://example.com/photo-1600.avif 1600w",
				),
				image,
			);

			expect(findBestImage(image)?.url).toBe(
				"https://example.com/photo-1600.avif",
			);
		});

		it.each([
			[
				"https://example.com/mobile-400.avif",
				"https://example.com/mobile-800.avif",
			],
			[
				"https://example.com/desktop-1600.avif",
				"https://example.com/desktop-3200.avif",
			],
		])("keeps the crop of the chosen source (%s)", (currentSrc, expected) => {
			const image = createImage({ currentSrc });
			createPicture(
				createSource(
					"https://example.com/mobile-400.avif 400w, https://example.com/mobile-800.avif 800w",
				),
				createSource(
					"https://example.com/desktop-1600.avif 1600w, https://example.com/desktop-3200.avif 3200w",
				),
				image,
			);

			expect(findBestImage(image)?.url).toBe(expected);
		});

		it("matches candidates written as relative urls", () => {
			const image = createImage({ currentSrc: resolve("photo-800.avif") });
			createPicture(
				createSource("photo-800.avif 800w, photo-1600.avif 1600w"),
				image,
			);

			expect(findBestImage(image)?.url).toBe(resolve("photo-1600.avif"));
		});

		it("uses the own srcset when no source lists the current url", () => {
			const image = createImage({
				currentSrc: "https://example.com/own-1.jpg",
				srcset:
					"https://example.com/own-1.jpg 1x, https://example.com/own-2.jpg 2x",
			});
			createPicture(
				createSource(
					"https://example.com/other-1.avif 1x, https://example.com/other-2.avif 2x",
				),
				image,
			);

			expect(findBestImage(image)?.url).toBe("https://example.com/own-2.jpg");
		});

		it("finds nothing while the image has no current url yet", () => {
			const image = createImage({ src: "https://example.com/fallback.jpg" });
			createPicture(
				createSource(
					"https://example.com/a.avif 1x, https://example.com/b.avif 2x",
				),
				image,
			);

			expect(findBestImage(image)).toBeNull();
		});

		it("ignores sources that come after the image", () => {
			const image = createImage({ currentSrc: "https://example.com/a.avif" });
			createPicture(
				image,
				createSource(
					"https://example.com/a.avif 1x, https://example.com/b.avif 2x",
				),
			);

			expect(findBestImage(image)).toBeNull();
		});

		it("ignores sources when the picture is not the direct parent", () => {
			const image = createImage({ currentSrc: "https://example.com/a.avif" });
			const wrapper = document.createElement("span");
			wrapper.append(image);
			createPicture(
				createSource(
					"https://example.com/a.avif 1x, https://example.com/b.avif 2x",
				),
				wrapper,
			);

			expect(findBestImage(image)).toBeNull();
		});

		it("skips a malformed candidate and still matches the source", () => {
			const image = createImage({
				currentSrc: "https://example.com/photo.avif",
			});
			createPicture(
				createSource("http://[invalid 1x, https://example.com/photo.avif 2x"),
				image,
			);

			expect(findBestImage(image)?.url).toBe("https://example.com/photo.avif");
		});
	});
});
