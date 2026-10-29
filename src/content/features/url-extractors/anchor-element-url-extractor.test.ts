import { describe, expect, it } from "vitest";
import { AnchorElementUrlExtractor } from "./anchor-element-url-extractor";

const IMAGE_FORMATS = [
	"avif",
	"bmp",
	"gif",
	"jpeg",
	"jpg",
	"png",
	"svg",
	"webp",
];

const createAnchor = (href?: string) => {
	const el = document.createElement("a");
	if (href !== undefined) el.href = href;

	return el;
};

describe("AnchorElementUrlExtractor", () => {
	const extractor = new AnchorElementUrlExtractor();

	describe("links with a file extension", () => {
		it.each(IMAGE_FORMATS)(
			"returns the url of a link to a .%s file",
			(format) => {
				const el = createAnchor(`https://example.com/images/photo.${format}`);

				expect(extractor.extract([el])).toBe(el.href);
			},
		);

		it("matches the extension case-insensitively", () => {
			const el = createAnchor("https://example.com/PHOTO.PNG");

			expect(extractor.extract([el])).toBe(el.href);
		});

		it("accepts the http and file protocols", () => {
			const http = createAnchor("http://example.com/photo.png");
			const file = createAnchor("file:///home/user/photo.png");

			expect(extractor.extract([http])).toBe(http.href);
			expect(extractor.extract([file])).toBe(file.href);
		});

		it("ignores the query and the hash", () => {
			const el = createAnchor("https://example.com/photo.png?size=large#top");

			expect(extractor.extract([el])).toBe(el.href);
		});

		it.each(["photo.pdf", "photo.html", "photo", "photo.png.zip"])(
			"returns null for %s",
			(name) => {
				const el = createAnchor(`https://example.com/${name}`);

				expect(extractor.extract([el])).toBeNull();
			},
		);
	});

	describe("protocols", () => {
		it.each([
			"javascript:alert(1).png",
			"ftp://example.com/photo.png",
			"blob:https://example.com/photo.png",
		])("rejects %s", (href) => {
			const el = createAnchor(href);

			expect(extractor.extract([el])).toBeNull();
		});

		it("returns null for an invalid url", () => {
			const el = createAnchor("http://");

			expect(extractor.extract([el])).toBeNull();
		});

		it("returns null for an anchor without href", () => {
			const el = createAnchor();

			expect(extractor.extract([el])).toBeNull();
		});
	});

	describe("data urls", () => {
		it.each(IMAGE_FORMATS)(
			"returns the url of a data url with %s",
			(format) => {
				const el = createAnchor(`data:image/${format};base64,AAAA`);

				expect(extractor.extract([el])).toBe(el.href);
			},
		);

		it("accepts svg+xml with and without parameters", () => {
			const plain = createAnchor("data:image/svg+xml,%3Csvg%3E%3C/svg%3E");
			const encoded = createAnchor(
				"data:image/svg+xml;utf8,%3Csvg%3E%3C/svg%3E",
			);

			expect(extractor.extract([plain])).toBe(plain.href);
			expect(extractor.extract([encoded])).toBe(encoded.href);
		});

		it("matches the MIME type case-insensitively", () => {
			const el = createAnchor("data:IMAGE/PNG;base64,AAAA");

			expect(extractor.extract([el])).toBe(el.href);
		});

		it.each([
			"data:text/html,<h1>Hi</h1>",
			"data:application/pdf;base64,AAAA",
			"data:image/x-icon;base64,AAAA",
			"data:image/png",
			"data:,hello",
		])("rejects %s", (href) => {
			const el = createAnchor(href);

			expect(extractor.extract([el])).toBeNull();
		});

		it("does not look for an extension in a data url", () => {
			const el = createAnchor("data:text/plain,cat.png");

			expect(extractor.extract([el])).toBeNull();
		});
	});

	describe("element choice", () => {
		it("skips elements that are not anchors", () => {
			const div = document.createElement("div");
			const img = document.createElement("img");
			const el = createAnchor("https://example.com/photo.png");

			expect(extractor.extract([div, img, el])).toBe(el.href);
		});

		it("uses only the first anchor", () => {
			const first = createAnchor("https://example.com/page.html");
			const second = createAnchor("https://example.com/photo.png");

			expect(extractor.extract([first, second])).toBeNull();
		});

		it("returns the first anchor when several link to images", () => {
			const first = createAnchor("https://example.com/first.png");
			const second = createAnchor("https://example.com/second.png");

			expect(extractor.extract([first, second])).toBe(first.href);
		});

		it("returns null when there are no anchors", () => {
			const img = document.createElement("img");

			expect(extractor.extract([img])).toBeNull();
			expect(extractor.extract([])).toBeNull();
		});
	});
});
