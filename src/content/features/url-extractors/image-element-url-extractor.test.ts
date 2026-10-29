import { describe, expect, it } from "vitest";
import { ImageElementUrlExtractor } from "./image-element-url-extractor";

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
	const el = document.createElement("img");

	// jsdom doesn't load images, so it never sets the current source.
	Object.defineProperty(el, "currentSrc", { value: currentSrc });

	if (src) el.src = src;
	if (srcset) el.srcset = srcset;

	return el;
};

const createPicture = (...children: Element[]) => {
	const el = document.createElement("picture");
	el.append(...children);

	return el;
};

const createSource = (srcset: string) => {
	const el = document.createElement("source");
	el.srcset = srcset;

	return el;
};

describe("ImageElementUrlExtractor", () => {
	const extractor = new ImageElementUrlExtractor();

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
			const el = createImage({ srcset });

			expect(extractor.extract([el])).toBe(expected);
		});

		it("prefers the srcset over src and currentSrc", () => {
			const el = createImage({
				currentSrc: "https://example.com/current.jpg",
				src: "https://example.com/src.jpg",
				srcset: "https://example.com/a.jpg 1x, https://example.com/b.jpg 2x",
			});

			expect(extractor.extract([el])).toBe("https://example.com/b.jpg");
		});
	});

	describe("fallbacks", () => {
		it("uses currentSrc when there is no srcset", () => {
			const el = createImage({
				currentSrc: "https://example.com/current.jpg",
				src: "https://example.com/src.jpg",
			});

			expect(extractor.extract([el])).toBe("https://example.com/current.jpg");
		});

		it("uses src when there is no srcset and no currentSrc", () => {
			const el = createImage({ src: "https://example.com/src.jpg" });

			expect(extractor.extract([el])).toBe(el.src);
		});

		it("returns null for an image without any source", () => {
			const el = createImage();

			expect(extractor.extract([el])).toBeNull();
		});
	});

	describe("element choice", () => {
		it("skips elements that are not images", () => {
			const div = document.createElement("div");
			const el = createImage({ src: "https://example.com/a.jpg" });

			expect(extractor.extract([div, el])).toBe(el.src);
		});

		it("uses only the first image", () => {
			const first = createImage({ src: "https://example.com/first.jpg" });
			const second = createImage({ src: "https://example.com/second.jpg" });

			expect(extractor.extract([first, second])).toBe(first.src);
		});

		it("returns null when there are no images", () => {
			const div = document.createElement("div");

			expect(extractor.extract([div])).toBeNull();
			expect(extractor.extract([])).toBeNull();
		});
	});

	describe("inside a picture", () => {
		it("reads the srcset of the source the browser chose", () => {
			const el = createImage({
				currentSrc: "https://example.com/photo-800.avif",
				src: "https://example.com/photo-800.jpg",
			});
			createPicture(
				createSource(
					"https://example.com/photo-800.avif 800w, https://example.com/photo-1600.avif 1600w",
				),
				el,
			);

			expect(extractor.extract([el])).toBe(
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
			const el = createImage({ currentSrc });
			createPicture(
				createSource(
					"https://example.com/mobile-400.avif 400w, https://example.com/mobile-800.avif 800w",
				),
				createSource(
					"https://example.com/desktop-1600.avif 1600w, https://example.com/desktop-3200.avif 3200w",
				),
				el,
			);

			expect(extractor.extract([el])).toBe(expected);
		});

		it("matches candidates written as relative urls", () => {
			const el = createImage({ currentSrc: resolve("photo-800.avif") });
			createPicture(
				createSource("photo-800.avif 800w, photo-1600.avif 1600w"),
				el,
			);

			const url = extractor.extract([el]);

			expect(url && resolve(url)).toBe(resolve("photo-1600.avif"));
		});

		it("uses the own srcset when no source lists the current url", () => {
			const el = createImage({
				currentSrc: "https://example.com/own-1.jpg",
				srcset:
					"https://example.com/own-1.jpg 1x, https://example.com/own-2.jpg 2x",
			});
			createPicture(
				createSource(
					"https://example.com/other-1.avif 1x, https://example.com/other-2.avif 2x",
				),
				el,
			);

			expect(extractor.extract([el])).toBe("https://example.com/own-2.jpg");
		});

		it("falls back to src while the image has no current url yet", () => {
			const el = createImage({ src: "https://example.com/fallback.jpg" });
			createPicture(
				createSource(
					"https://example.com/a.avif 1x, https://example.com/b.avif 2x",
				),
				el,
			);

			expect(extractor.extract([el])).toBe(el.src);
		});

		it("ignores sources that come after the image", () => {
			const el = createImage({ currentSrc: "https://example.com/a.avif" });
			createPicture(
				el,
				createSource(
					"https://example.com/a.avif 1x, https://example.com/b.avif 2x",
				),
			);

			expect(extractor.extract([el])).toBe("https://example.com/a.avif");
		});

		it("ignores sources when the picture is not the direct parent", () => {
			const el = createImage({ currentSrc: "https://example.com/a.avif" });
			const wrapper = document.createElement("span");
			wrapper.append(el);
			createPicture(
				createSource(
					"https://example.com/a.avif 1x, https://example.com/b.avif 2x",
				),
				wrapper,
			);

			expect(extractor.extract([el])).toBe("https://example.com/a.avif");
		});

		it("skips a malformed candidate without throwing", () => {
			const el = createImage({ currentSrc: "https://example.com/photo.avif" });
			createPicture(
				createSource("http://[invalid 1x, https://example.com/photo.avif 2x"),
				el,
			);

			expect(() => extractor.extract([el])).not.toThrow();
		});
	});
});
