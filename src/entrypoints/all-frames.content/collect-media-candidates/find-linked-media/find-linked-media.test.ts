import { describe, expect, it } from "vitest";
import { MEDIA_TYPE } from "@/shared/constants";
import { findLinkedMedia } from "./find-linked-media";

const IMAGE_FORMATS = ["gif", "jpeg", "jpg", "png", "webp"];

const VIDEO_FORMATS = ["mp4", "webm"];

const IMAGE_MIME_TYPES = ["image/gif", "image/jpeg", "image/png", "image/webp"];

const VIDEO_MIME_TYPES = ["video/mp4", "video/webm"];

const createAnchor = (href?: string, ...children: Element[]) => {
	const anchor = document.createElement("a");
	if (href !== undefined) anchor.href = href;
	anchor.append(...children);

	return anchor;
};

const createImage = () => document.createElement("img");

// The image inside a link with the href.
const createLinkedImage = (href?: string) => {
	const image = createImage();
	createAnchor(href, image);

	return image;
};

describe("findLinkedMedia", () => {
	describe("links with a file extension", () => {
		it.each(IMAGE_FORMATS)("finds an image behind a link to .%s", (format) => {
			const image = createLinkedImage(`https://example.com/photo.${format}`);

			expect(findLinkedMedia(image)).toEqual({
				type: MEDIA_TYPE.IMAGE,
				url: `https://example.com/photo.${format}`,
			});
		});

		it.each(VIDEO_FORMATS)("finds a video behind a link to .%s", (format) => {
			const image = createLinkedImage(`https://example.com/clip.${format}`);

			expect(findLinkedMedia(image)).toEqual({
				type: MEDIA_TYPE.VIDEO,
				url: `https://example.com/clip.${format}`,
			});
		});

		it("matches the extension case-insensitively", () => {
			const image = createLinkedImage("https://example.com/PHOTO.PNG");

			expect(findLinkedMedia(image)?.type).toBe(MEDIA_TYPE.IMAGE);
		});

		it("accepts the http and file protocols", () => {
			const http = createLinkedImage("http://example.com/photo.png");
			const file = createLinkedImage("file:///home/user/photo.png");

			expect(findLinkedMedia(http)?.url).toBe("http://example.com/photo.png");
			expect(findLinkedMedia(file)?.url).toBe("file:///home/user/photo.png");
		});

		it("ignores the query and the hash", () => {
			const image = createLinkedImage(
				"https://example.com/photo.png?size=large#top",
			);

			expect(findLinkedMedia(image)?.url).toBe(
				"https://example.com/photo.png?size=large#top",
			);
		});

		it.each([
			"photo.pdf",
			"photo.html",
			"photo",
			"photo.",
			"v1.2/photo",
			"png",
			"photo.png.zip",
			"clip.avi",
		])("finds nothing behind a link to %s", (name) => {
			const image = createLinkedImage(`https://example.com/${name}`);

			expect(findLinkedMedia(image)).toBeUndefined();
		});
	});

	describe("protocols", () => {
		it.each([
			"javascript:alert(1).png",
			"ftp://example.com/photo.png",
			"blob:https://example.com/photo.png",
		])("rejects %s", (href) => {
			expect(findLinkedMedia(createLinkedImage(href))).toBeUndefined();
		});

		it("finds nothing behind an invalid url", () => {
			expect(findLinkedMedia(createLinkedImage("http://"))).toBeUndefined();
		});
	});

	describe("data urls", () => {
		it.each(IMAGE_MIME_TYPES)(
			"finds an image in a data url with %s",
			(type) => {
				const href = `data:${type};base64,AAAA`;

				expect(findLinkedMedia(createLinkedImage(href))).toEqual({
					type: MEDIA_TYPE.IMAGE,
					url: href,
				});
			},
		);

		it.each(VIDEO_MIME_TYPES)("finds a video in a data url with %s", (type) => {
			const href = `data:${type};base64,AAAA`;

			expect(findLinkedMedia(createLinkedImage(href))).toEqual({
				type: MEDIA_TYPE.VIDEO,
				url: href,
			});
		});

		it("accepts the MIME type with and without parameters", () => {
			const plain = createLinkedImage("data:image/png,AAAA");
			const encoded = createLinkedImage("data:image/png;base64,AAAA");

			expect(findLinkedMedia(plain)?.type).toBe(MEDIA_TYPE.IMAGE);
			expect(findLinkedMedia(encoded)?.type).toBe(MEDIA_TYPE.IMAGE);
		});

		it("matches the MIME type case-insensitively", () => {
			const image = createLinkedImage("data:IMAGE/PNG;base64,AAAA");

			expect(findLinkedMedia(image)?.type).toBe(MEDIA_TYPE.IMAGE);
		});

		// Whether the data behind the MIME type loads is for the viewer to find out.
		it("accepts a data url without data", () => {
			const image = createLinkedImage("data:image/png");

			expect(findLinkedMedia(image)?.type).toBe(MEDIA_TYPE.IMAGE);
		});

		it.each([
			"data:text/html,<h1>Hi</h1>",
			"data:application/pdf;base64,AAAA",
			"data:image/tiff;base64,AAAA",
			"data:image/png.foo;base64,AAAA",
			"data:image/svg+json,AAAA",
			"data:image/jpg;base64,AAAA",
			"data:image/svg,%3Csvg%3E%3C/svg%3E",
			"data:video/mov;base64,AAAA",
			"data:video/x-msvideo;base64,AAAA",
			"data:,hello",
		])("rejects %s", (href) => {
			expect(findLinkedMedia(createLinkedImage(href))).toBeUndefined();
		});

		it("does not look for an extension in a data url", () => {
			const image = createLinkedImage("data:text/plain,cat.png");

			expect(findLinkedMedia(image)).toBeUndefined();
		});
	});

	describe("link choice", () => {
		it("finds the link the element is in, not one around that", () => {
			const image = createImage();
			const inner = createAnchor("https://example.com/page.html", image);
			createAnchor("https://example.com/photo.png", inner);

			expect(findLinkedMedia(image)).toBeUndefined();
		});

		it("finds a link further up the tree", () => {
			const image = createImage();
			const wrapper = document.createElement("figure");
			wrapper.append(image);
			createAnchor("https://example.com/photo.png", wrapper);

			expect(findLinkedMedia(image)?.url).toBe("https://example.com/photo.png");
		});

		it("finds a link around the shadow host of the element", () => {
			const image = createImage();
			const host = document.createElement("div");
			host.attachShadow({ mode: "open" }).append(image);
			createAnchor("https://example.com/photo.png", host);

			expect(findLinkedMedia(image)?.url).toBe("https://example.com/photo.png");
		});

		it("finds the link inside the shadow root before one around the host", () => {
			const image = createImage();
			const host = document.createElement("div");
			host
				.attachShadow({ mode: "open" })
				.append(createAnchor("https://example.com/page.html", image));
			createAnchor("https://example.com/photo.png", host);

			expect(findLinkedMedia(image)).toBeUndefined();
		});

		it("finds nothing for a link without href", () => {
			expect(findLinkedMedia(createLinkedImage())).toBeUndefined();
		});

		it("finds nothing for an element outside any link", () => {
			const image = createImage();
			document.createElement("div").append(image);

			expect(findLinkedMedia(image)).toBeUndefined();
		});

		it("finds nothing for a link of an svg document", () => {
			const image = document.createElementNS(
				"http://www.w3.org/2000/svg",
				"image",
			);
			const anchor = document.createElementNS(
				"http://www.w3.org/2000/svg",
				"a",
			);
			anchor.setAttribute("href", "https://example.com/photo.png");
			anchor.append(image);

			expect(findLinkedMedia(image)).toBeUndefined();
		});
	});
});
