import { MEDIA_TYPE } from "@shared/constants";
import type { MediaCandidate, Optional } from "@shared/types";

type SrcsetCandidate = Readonly<{
	size: number;
	url: string;
}>;

// Matches one srcset candidate per match.
// Capture groups:
// 1. The url: a run without spaces that may contain commas but doesn't end
//    with one.
// 2. The optional descriptor, like "480w" or "2x".
const CANDIDATE_REGEX = /[\s,]*(\S*[^\s,])(?:\s+([^\s,]+))?/g;

// Matches a srcset descriptor.
// Capture groups:
// 1. The number. The unit (w or x) isn't captured: sorting candidates only
//    needs the numbers, as a valid srcset uses the same unit for all of them.
const DESCRIPTOR_REGEX = /^(\d+(?:\.\d+)?)[wx]$/;

// The size of src, which the spec counts as a 1x candidate.
const SRC_SIZE = 1;

const getSize = (descriptor?: string): Optional<number> => {
	const value = descriptor?.match(DESCRIPTOR_REGEX)?.[1];
	return value ? Number(value) : undefined;
};

const getCandidates = (srcset: string, baseURI: string): SrcsetCandidate[] => {
	const candidates: SrcsetCandidate[] = [];

	for (const [, url, descriptor] of srcset.matchAll(CANDIDATE_REGEX)) {
		const href = url && URL.parse(url, baseURI)?.href;
		const size = getSize(descriptor);

		if (href && size) candidates.push({ size, url: href });
	}

	return candidates;
};

const getImageCandidates = (image: HTMLImageElement): SrcsetCandidate[] => {
	const candidates = getCandidates(image.srcset, image.baseURI);
	const { currentSrc, src } = image;

	if (candidates.some(({ url }) => url === currentSrc)) return candidates;

	// The page displays a url without a descriptor, so the candidates can't be
	// ordered against it. Only the url of the menu is safe to show.
	if (currentSrc && currentSrc !== src) return [];

	// The page displays src or hasn't picked a candidate yet. Listing src as
	// the 1x candidate sorts it into place, so a candidate below 1x doesn't
	// end up ahead of it. Without any candidates there is nothing to sort it
	// among, and the url of the menu carries it anyway.
	return src && candidates.length
		? [...candidates, { size: SRC_SIZE, url: src }]
		: candidates;
};

// The browser picks one <source> of a <picture> by its media and type. There
// is no API for the choice, but currentSrc is the candidate it picked, so the
// matching <source> is the one that lists that url.
const findSourceCandidates = (
	image: HTMLImageElement,
): Optional<SrcsetCandidate[]> => {
	const picture = image.parentElement;

	if (!(picture instanceof HTMLPictureElement)) return;

	for (const element of picture.children) {
		// Only the <source> elements before the image take part in the choice.
		if (element === image) break;
		if (!(element instanceof HTMLSourceElement)) continue;

		const candidates = getCandidates(element.srcset, image.baseURI);

		if (candidates.some(({ url }) => url === image.currentSrc)) {
			return candidates;
		}
	}
};

export const findSrcsetImages = (image: HTMLImageElement): MediaCandidate[] =>
	(findSourceCandidates(image) ?? getImageCandidates(image))
		.sort((first, second) => second.size - first.size)
		.map(({ url }) => ({ type: MEDIA_TYPE.IMAGE, url }));
