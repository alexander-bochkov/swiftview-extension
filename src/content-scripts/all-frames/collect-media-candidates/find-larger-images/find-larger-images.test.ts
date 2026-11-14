import { MEDIA_TYPE } from "@shared/constants";
import { describe, expect, it } from "vitest";
import { findLargerImages } from "./find-larger-images";

type ImageInit = {
	currentSrc?: string;
	src?: string;
	srcset?: string;
};

const resolve = (url: string) => new URL(url, document.baseURI).href;

const urls = (images: { url: string }[]) => images.map(({ url }) => url);

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

describe("findLargerImages", () => {
	describe("srcset", () => {
		it("lists the candidates larger than the displayed one, largest first", () => {
			const image = createImage({
				currentSrc: "https://example.com/a-480.jpg",
				srcset:
					"https://example.com/a-480.jpg 480w, https://example.com/a-1600.jpg 1600w, https://example.com/a-800.jpg 800w",
			});

			expect(findLargerImages(image)).toEqual([
				{ type: MEDIA_TYPE.IMAGE, url: "https://example.com/a-1600.jpg" },
				{ type: MEDIA_TYPE.IMAGE, url: "https://example.com/a-800.jpg" },
			]);
		});

		it("leaves out the displayed candidate and the smaller ones", () => {
			const image = createImage({
				currentSrc: "https://example.com/a-2x.jpg",
				srcset:
					"https://example.com/a.jpg 1x, https://example.com/a-3x.jpg 3x, https://example.com/a-2x.jpg 2x",
			});

			expect(urls(findLargerImages(image))).toEqual([
				"https://example.com/a-3x.jpg",
			]);
		});

		it("lists nothing when the page displays the largest candidate", () => {
			const image = createImage({
				currentSrc: "https://example.com/a-3x.jpg",
				srcset: "https://example.com/a.jpg 1x, https://example.com/a-3x.jpg 3x",
			});

			expect(findLargerImages(image)).toEqual([]);
		});

		it("compares decimal descriptors", () => {
			const image = createImage({
				currentSrc: "https://example.com/b.jpg",
				srcset: "https://example.com/a.jpg 2.5x, https://example.com/b.jpg 2x",
			});

			expect(urls(findLargerImages(image))).toEqual([
				"https://example.com/a.jpg",
			]);
		});

		it.each([
			["the src", "https://example.com/src.jpg"],
			["nothing yet", ""],
		])(
			"counts the displayed image as 1x when the page displays %s",
			(_, currentSrc) => {
				const image = createImage({
					currentSrc,
					src: "https://example.com/src.jpg",
					srcset: "https://example.com/a.jpg 1x, https://example.com/b.jpg 2x",
				});

				expect(urls(findLargerImages(image))).toEqual([
					"https://example.com/b.jpg",
				]);
			},
		);

		it("matches the displayed candidate by its resolved url", () => {
			const image = createImage({
				currentSrc: resolve("b.jpg"),
				srcset: "a.jpg 1x, b.jpg 2x, c.jpg 3x",
			});

			expect(urls(findLargerImages(image))).toEqual([resolve("c.jpg")]);
		});

		it.each([
			[
				"a candidate without a descriptor (1x)",
				"https://example.com/a.jpg, https://example.com/b.jpg 2x",
			],
			[
				"a candidate with an unknown descriptor",
				"https://example.com/a.jpg 100h, https://example.com/b.jpg 2x",
			],
			[
				"a candidate with an invalid url",
				"http://[invalid 3x, https://example.com/b.jpg 2x",
			],
		])("skips %s", (_, srcset) => {
			expect(urls(findLargerImages(createImage({ srcset })))).toEqual([
				"https://example.com/b.jpg",
			]);
		});

		it.each([
			[
				"only candidates without a descriptor",
				"https://example.com/a.jpg, https://example.com/b.jpg",
			],
			["only a candidate with an invalid url", "http://[invalid 2x"],
		])("lists nothing with %s", (_, srcset) => {
			expect(findLargerImages(createImage({ srcset }))).toEqual([]);
		});

		it("keeps the urls with commas whole", () => {
			const image = createImage({
				srcset:
					"https://example.com/w_100,h_100/a.jpg 1x, https://example.com/w_200,h_200/a.jpg 2x",
			});

			expect(urls(findLargerImages(image))).toEqual([
				"https://example.com/w_200,h_200/a.jpg",
			]);
		});

		it("reads through extra whitespace and line breaks", () => {
			const image = createImage({
				srcset:
					"https://example.com/a.jpg 1x,\n   https://example.com/b.jpg   2x\n",
			});

			expect(urls(findLargerImages(image))).toEqual([
				"https://example.com/b.jpg",
			]);
		});

		it("resolves a relative candidate against the document", () => {
			const image = createImage({ srcset: "a.jpg 1x, b.jpg 2x" });

			expect(urls(findLargerImages(image))).toEqual([resolve("b.jpg")]);
		});
	});

	describe("without a srcset", () => {
		it("lists nothing, as the image displays its only url", () => {
			const image = createImage({
				currentSrc: "https://example.com/current.jpg",
				src: "https://example.com/src.jpg",
			});

			expect(findLargerImages(image)).toEqual([]);
		});

		it("lists nothing for an image without any source", () => {
			expect(findLargerImages(createImage())).toEqual([]);
		});
	});

	describe("inside a picture", () => {
		it("reads the srcset of the source the browser chose", () => {
			const image = createImage({
				currentSrc: "https://example.com/photo-400.avif",
				src: "https://example.com/photo-400.jpg",
			});
			createPicture(
				createSource(
					"https://example.com/photo-400.avif 400w, https://example.com/photo-1600.avif 1600w, https://example.com/photo-800.avif 800w",
				),
				image,
			);

			expect(urls(findLargerImages(image))).toEqual([
				"https://example.com/photo-1600.avif",
				"https://example.com/photo-800.avif",
			]);
		});

		it("lists nothing when the page displays the largest candidate of the source", () => {
			const image = createImage({
				currentSrc: "https://example.com/photo-1600.avif",
			});
			createPicture(
				createSource(
					"https://example.com/photo-800.avif 800w, https://example.com/photo-1600.avif 1600w",
				),
				image,
			);

			expect(findLargerImages(image)).toEqual([]);
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

			expect(urls(findLargerImages(image))).toEqual([expected]);
		});

		it("matches candidates written as relative urls", () => {
			const image = createImage({ currentSrc: resolve("photo-800.avif") });
			createPicture(
				createSource("photo-800.avif 800w, photo-1600.avif 1600w"),
				image,
			);

			expect(urls(findLargerImages(image))).toEqual([
				resolve("photo-1600.avif"),
			]);
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

			expect(urls(findLargerImages(image))).toEqual([
				"https://example.com/own-2.jpg",
			]);
		});

		it("lists nothing while the image has no current url yet", () => {
			const image = createImage({ src: "https://example.com/fallback.jpg" });
			createPicture(
				createSource(
					"https://example.com/a.avif 1x, https://example.com/b.avif 2x",
				),
				image,
			);

			expect(findLargerImages(image)).toEqual([]);
		});

		it("ignores sources that come after the image", () => {
			const image = createImage({ currentSrc: "https://example.com/a.avif" });
			createPicture(
				image,
				createSource(
					"https://example.com/a.avif 1x, https://example.com/b.avif 2x",
				),
			);

			expect(findLargerImages(image)).toEqual([]);
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

			expect(findLargerImages(image)).toEqual([]);
		});

		it("skips a malformed candidate and still matches the source", () => {
			const image = createImage({
				currentSrc: "https://example.com/photo.avif",
			});
			createPicture(
				createSource(
					"http://[invalid 3x, https://example.com/photo.avif 1x, https://example.com/photo-2x.avif 2x",
				),
				image,
			);

			expect(urls(findLargerImages(image))).toEqual([
				"https://example.com/photo-2x.avif",
			]);
		});
	});
});
