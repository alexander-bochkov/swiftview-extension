import { MEDIA_TYPE } from "@shared/constants";
import type { MediaCandidate, MediaElement, Optional } from "@shared/types";
import { findLargerImages } from "./find-larger-images";
import { findLinkedMedia } from "./find-linked-media";

const dedupe = (
	candidates: readonly Optional<MediaCandidate>[],
): MediaCandidate[] =>
	candidates
		.filter((candidate) => !!candidate)
		.filter(
			(candidate, index, all) =>
				all.findIndex(({ url }) => url === candidate.url) === index,
		);

const collectImageCandidates = (
	image: HTMLImageElement,
	srcUrl: string,
): MediaCandidate[] =>
	dedupe([
		findLinkedMedia(image),
		...findLargerImages(image),
		{ type: MEDIA_TYPE.IMAGE, url: srcUrl },
	]);

export const collectMediaCandidates = (
	element: MediaElement,
	srcUrl: string,
): MediaCandidate[] =>
	element instanceof HTMLImageElement
		? collectImageCandidates(element, srcUrl)
		: [{ type: MEDIA_TYPE.VIDEO, url: srcUrl }];
