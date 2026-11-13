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

// A candidate without a descriptor counts as 1x (the default of the spec).
const DEFAULT_SIZE = 1;

const findLargestCandidate = (
	candidates: readonly SrcsetCandidate[],
): Optional<SrcsetCandidate> =>
	candidates.reduce<Optional<SrcsetCandidate>>(
		(largest, candidate) =>
			!largest || candidate.size > largest.size ? candidate : largest,
		undefined,
	);

const getSize = (descriptor?: string): number => {
	const value = descriptor?.match(DESCRIPTOR_REGEX)?.[1];
	return value ? Number(value) : DEFAULT_SIZE;
};

const getCandidates = (srcset: string, baseURI: string): SrcsetCandidate[] => {
	const candidates: SrcsetCandidate[] = [];

	for (const [, url, descriptor] of srcset.matchAll(CANDIDATE_REGEX)) {
		const href = url && URL.parse(url, baseURI)?.href;
		if (href) candidates.push({ size: getSize(descriptor), url: href });
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

export const findBestImage = (
	image: HTMLImageElement,
): Optional<MediaCandidate> => {
	const candidates =
		findSourceCandidates(image) ?? getCandidates(image.srcset, image.baseURI);
	const largest = findLargestCandidate(candidates);
	return largest && { type: MEDIA_TYPE.IMAGE, url: largest.url };
};
