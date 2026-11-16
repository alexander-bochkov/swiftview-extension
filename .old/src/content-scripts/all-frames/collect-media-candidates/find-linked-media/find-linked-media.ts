import { MEDIA_TYPE, MEDIA_TYPES } from "@shared/constants";
import type { MediaCandidate, MediaType, Optional } from "@shared/types";

// Matches the file extension at the end of a path.
// Capture groups:
// 1. The extension without the dot.
const EXTENSION_REGEX = /\.([a-z0-9]+)$/i;

// Matches a simple MIME type at the start of a string, like "image/png" in
// "image/png;base64,...". Subtypes with "-" or "." don't match: none of them
// doubles as a file extension.
// Capture groups:
// 1. The type: "image", "video", "text" and so on.
// 2. The subtype without the "+xml" suffix: "png", "svg", "mp4" and so on.
const MIME_TYPE_REGEX = /^([a-z]+)\/([a-z0-9]+)(?:\+xml)?(?![a-z0-9.+-])/i;

const EXTENSIONS: Readonly<Record<MediaType, readonly string[]>> = {
	[MEDIA_TYPE.IMAGE]: [
		"avif",
		"bmp",
		"gif",
		"jpeg",
		"jpg",
		"png",
		"svg",
		"webp",
	],
	[MEDIA_TYPE.VIDEO]: ["m4v", "mp4", "ogv", "webm"],
};

const hasExtension = (type: MediaType, extension: string): boolean =>
	EXTENSIONS[type].includes(extension.toLowerCase());

const findTypeByExtension = (pathname: string): Optional<MediaType> => {
	const [, extension = ""] = pathname.match(EXTENSION_REGEX) ?? [];
	return MEDIA_TYPES.find((mediaType) => hasExtension(mediaType, extension));
};

const findTypeByMimeType = (pathname: string): Optional<MediaType> => {
	const [, type = "", subtype = ""] = pathname.match(MIME_TYPE_REGEX) ?? [];
	return MEDIA_TYPES.find(
		(mediaType) =>
			mediaType === type.toLowerCase() && hasExtension(mediaType, subtype),
	);
};

// Other protocols are rejected on purpose:
// for example `javascript:alert(1).png` has a path that looks like an image.
const TYPE_FINDERS: Readonly<
	Record<string, (pathname: string) => Optional<MediaType>>
> = {
	"data:": findTypeByMimeType,
	"file:": findTypeByExtension,
	"http:": findTypeByExtension,
	"https:": findTypeByExtension,
};

const findAnchor = (element: Element): Optional<HTMLAnchorElement> => {
	const anchor = element.closest("a[href]");
	if (anchor instanceof HTMLAnchorElement) return anchor;

	const root = element.getRootNode();
	if (root instanceof ShadowRoot) return findAnchor(root.host);
};

export const findLinkedMedia = (element: Element): Optional<MediaCandidate> => {
	const anchor = findAnchor(element);

	// For an invalid url the anchor reports the protocol ":" and an empty path.
	const type = anchor && TYPE_FINDERS[anchor.protocol]?.(anchor.pathname);
	return type && { type, url: anchor.href };
};
