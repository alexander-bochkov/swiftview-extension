import { MEDIA_TYPE } from "@shared/constants";
import type { MediaCandidate, MediaType, Nullable } from "@shared/types";

// Matches the MIME type at the start of the path of a data url, which is
// everything after "data:".
// Capture groups:
// 1. The type: "image" or "video".
// 2. The subtype without the "+xml" suffix: "png", "svg", "mp4" and so on.
const DATA_MIME_REGEX = /^(image|video)\/([a-z0-9]+)(?:\+xml)?[;,]/i;

// Matches the file extension at the end of a path.
// Capture groups:
// 1. The extension without the dot.
const EXTENSION_REGEX = /\.([a-z0-9]+)$/i;

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

const findTypeOfDataUrl = (pathname: string): Nullable<MediaType> => {
	const [, mimeType = "", mimeSubtype = ""] =
		pathname.match(DATA_MIME_REGEX) ?? [];

	return (
		Object.values(MEDIA_TYPE).find(
			(type) =>
				type === mimeType.toLowerCase() && hasExtension(type, mimeSubtype),
		) ?? null
	);
};

const findTypeByPathname = (pathname: string): Nullable<MediaType> => {
	const [, extension = ""] = pathname.match(EXTENSION_REGEX) ?? [];

	return (
		Object.values(MEDIA_TYPE).find((type) => hasExtension(type, extension)) ??
		null
	);
};

// How the media type is found for a url, by its protocol. Other protocols are
// rejected on purpose: for example `javascript:alert(1).png` has a path that
// looks like an image file.
const TYPE_FINDERS: Readonly<
	Record<string, (pathname: string) => Nullable<MediaType>>
> = {
	"data:": findTypeOfDataUrl,
	"file:": findTypeByPathname,
	"http:": findTypeByPathname,
	"https:": findTypeByPathname,
};

export const findLinkedMedia = (element: Element): Nullable<MediaCandidate> => {
	const anchor = element.closest("a[href]");

	if (!(anchor instanceof HTMLAnchorElement)) return null;

	// For an invalid url the anchor reports the protocol ":" and an empty path.
	const type = TYPE_FINDERS[anchor.protocol]?.(anchor.pathname);
	return type ? { type, url: anchor.href } : null;
};
