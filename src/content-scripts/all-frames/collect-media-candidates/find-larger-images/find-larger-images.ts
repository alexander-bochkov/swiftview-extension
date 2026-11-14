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
// 1. The number. The unit (w or x) isn't captured: comparing candidates only
//    needs the numbers, as a valid srcset uses the same unit for all of them.
const DESCRIPTOR_REGEX = /^(\d+(?:\.\d+)?)[wx]$/;

// The size of src, which the spec counts as a 1x candidate.
const SRC_SIZE = 1;

// The size of what the page displays: the candidate the browser picked, or src
// when the browser displays it or hasn't picked yet.
const getDisplayedSize = (
	candidates: readonly SrcsetCandidate[],
	currentSrc: string,
): number => candidates.find(({ url }) => url === currentSrc)?.size ?? SRC_SIZE;

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

export const findLargerImages = (image: HTMLImageElement): MediaCandidate[] => {
	const candidates =
		findSourceCandidates(image) ?? getCandidates(image.srcset, image.baseURI);
	const displayedSize = getDisplayedSize(candidates, image.currentSrc);

	return candidates
		.filter(({ size }) => size > displayedSize)
		.sort((first, second) => second.size - first.size)
		.map(({ url }) => ({ type: MEDIA_TYPE.IMAGE, url }));
};
