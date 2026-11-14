import { MEDIA_TYPE } from "@shared/constants";
import type { MediaCandidate, MediaElement, Optional } from "@shared/types";
import { findLinkedMedia } from "./find-linked-media";
import { findSrcsetImages } from "./find-srcset-images";

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
		...findSrcsetImages(image),
		{ type: MEDIA_TYPE.IMAGE, url: srcUrl },
	]);

export const collectMediaCandidates = (
	element: MediaElement,
	srcUrl: string,
): MediaCandidate[] =>
	element instanceof HTMLImageElement
		? collectImageCandidates(element, srcUrl)
		: [{ type: MEDIA_TYPE.VIDEO, url: srcUrl }];
