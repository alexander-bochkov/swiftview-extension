import type { Nullable } from "../../../shared/types";
import type { UrlExtractor } from "./types";

// A candidate without a descriptor counts as 1x (the spec's default).
const DEFAULT_SIZE = 1;

// Matches one srcset candidate per match.
// Capture groups:
// 1. The URL: a non-space run that may contain commas but doesn't end with one.
// 2. The optional descriptor (e.g. "480w", "2x").
const CANDIDATE_REGEX = /[\s,]*(\S*[^\s,])(?:\s+([^\s,]+))?/g;

// Matches a srcset descriptor and captures its number.
// Capture groups:
// 1. The number. The unit (w or x) isn't captured: comparing candidates only
//    needs the numbers, because a valid srcset uses the same unit
// 		for all of them.
const DESCRIPTOR_REGEX = /^(\d+(?:\.\d+)?)[wx]$/;

type Candidate = Readonly<{
	size: number;
	url: string;
}>;

export class ImageElementUrlExtractor implements UrlExtractor {
	extract(elements: readonly Element[]): Nullable<string> {
		const image = elements.find((el) => el instanceof HTMLImageElement);

		if (!image) return null;

		const srcset = this.findSourceSrcset(image) ?? image.srcset;
		const candidates = this.getCandidates(srcset);
		const largestCandidate = this.getLargestCandidate(candidates);

		return largestCandidate?.url || image.currentSrc || image.src || null;
	}

	private getCandidates(srcset: string): Candidate[] {
		const candidates: Candidate[] = [];

		for (const [, url, descriptor] of srcset.matchAll(CANDIDATE_REGEX)) {
			if (url) candidates.push({ size: this.getSize(descriptor), url });
		}

		return candidates;
	}

	private getSize(descriptor?: string): number {
		const value = descriptor?.match(DESCRIPTOR_REGEX)?.[1];
		return value ? Number(value) : DEFAULT_SIZE;
	}

	private getLargestCandidate(
		candidates: readonly Candidate[],
	): Nullable<Candidate> {
		return candidates.reduce<Nullable<Candidate>>(
			(largest, candidate) =>
				!largest || candidate.size > largest.size ? candidate : largest,
			null,
		);
	}

	// The browser picks one <source> of a <picture> by its media and type. There
	// is no API for the choice, but currentSrc is the candidate it picked, so the
	// matching <source> is the one that lists that url.
	private findSourceSrcset(image: HTMLImageElement): Nullable<string> {
		const picture = image.parentElement;

		if (!(picture instanceof HTMLPictureElement) || !image.currentSrc) {
			return null;
		}

		for (const el of picture.children) {
			// Only the <source> elements before the image take part in the choice.
			if (el === image) break;

			if (
				el instanceof HTMLSourceElement &&
				this.hasCandidate(el.srcset, image)
			) {
				return el.srcset;
			}
		}

		return null;
	}

	private hasCandidate(srcset: string, image: HTMLImageElement): boolean {
		return this.getCandidates(srcset).some(
			({ url }) => URL.parse(url, image.baseURI)?.href === image.currentSrc,
		);
	}
}
