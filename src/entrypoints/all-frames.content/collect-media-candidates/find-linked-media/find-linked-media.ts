import type { MediaCandidate, MediaType, Optional } from "@/shared/types";
import { TYPE_BY_EXTENSION, TYPE_BY_MIME_TYPE } from "./constants";

const findTypeByExtension = (pathname: string): Optional<MediaType> => {
	const extension = pathname.slice(pathname.lastIndexOf(".") + 1);
	return TYPE_BY_EXTENSION.get(extension.toLowerCase());
};

const findTypeByMimeType = (pathname: string): Optional<MediaType> => {
	const [mimeType = ""] = pathname.split(/[;,]/, 1);
	return TYPE_BY_MIME_TYPE.get(mimeType.toLowerCase());
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
