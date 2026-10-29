import type { Nullable } from "@shared/types";
import type { UrlExtractor } from "./types";

// Protocols whose urls are checked by the file extension. Other protocols are
// rejected on purpose: for example `javascript:alert(1).png` has a path that
// looks like an image file. A data url is checked by its MIME type instead.
const ALLOWED_PROTOCOLS: readonly string[] = ["file:", "http:", "https:"];

const DATA_PROTOCOL = "data:";

// Matches the file extension at the end of a path.
// Capture groups:
// 1. The extension without the dot.
const EXTENSION_REGEX = /\.([a-z0-9]+)$/i;

const IMAGE_EXTENSIONS: readonly string[] = [
	"avif",
	"bmp",
	"gif",
	"jpeg",
	"jpg",
	"png",
	"svg",
	"webp",
];

// Matches the subtype of an image MIME type at the start of a data url path.
// Capture groups:
// 1. The subtype without the "+xml" suffix: "png", "svg" and so on.
const IMAGE_SUBTYPE_REGEX = /^image\/([a-z0-9]+)(?:\+xml)?[;,]/i;

export class AnchorElementUrlExtractor implements UrlExtractor {
	extract(elements: readonly Element[]): Nullable<string> {
		const anchor = elements.find((el) => el instanceof HTMLAnchorElement);

		if (!anchor || !this.isImageLink(anchor)) return null;

		return anchor.href;
	}

	// For an invalid url the anchor reports the protocol ":" and an empty path.
	private isImageLink({ pathname, protocol }: HTMLAnchorElement): boolean {
		if (protocol === DATA_PROTOCOL) return this.isImageDataUrl(pathname);

		if (!ALLOWED_PROTOCOLS.includes(protocol)) return false;

		const extension = pathname.match(EXTENSION_REGEX)?.[1]?.toLowerCase();

		return extension !== undefined && IMAGE_EXTENSIONS.includes(extension);
	}

	// The path of a data url is everything after "data:", so it starts with the
	// MIME type.
	private isImageDataUrl(pathname: string): boolean {
		const subtype = pathname.match(IMAGE_SUBTYPE_REGEX)?.[1]?.toLowerCase();

		return subtype !== undefined && IMAGE_EXTENSIONS.includes(subtype);
	}
}
