import type { Nullable } from "@shared/types";
import type { UrlExtractor } from "./types";

// Other protocols are rejected on purpose: for example `javascript:alert(1).png`
// has a path that looks like an image file.
const ALLOWED_PROTOCOLS: readonly string[] = ["file:", "http:", "https:"];

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

export class AnchorElementUrlExtractor implements UrlExtractor {
	extract(elements: readonly Element[]): Nullable<string> {
		const anchor = elements.find(
			(element) => element instanceof HTMLAnchorElement,
		);

		if (!anchor || !this.isImageLink(anchor)) return null;

		return anchor.href;
	}

	// For an invalid url the anchor reports the protocol ":" and an empty path.
	private isImageLink({ pathname, protocol }: HTMLAnchorElement): boolean {
		if (!ALLOWED_PROTOCOLS.includes(protocol)) return false;

		const extension = pathname.match(EXTENSION_REGEX)?.[1]?.toLowerCase();

		return extension !== undefined && IMAGE_EXTENSIONS.includes(extension);
	}
}
