import { MEDIA_TYPE } from "@shared/constants";
import type { MediaCandidate, MediaElement, Nullable } from "@shared/types";
import { findBestImage } from "./find-best-image";
import { findLinkedMedia } from "./find-linked-media";

const dedupe = (
	candidates: readonly Nullable<MediaCandidate>[],
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
		findBestImage(image),
		{ type: MEDIA_TYPE.IMAGE, url: srcUrl },
	]);

export const collectMediaCandidates = (
	element: MediaElement,
	srcUrl: string,
): MediaCandidate[] =>
	element instanceof HTMLImageElement
		? collectImageCandidates(element, srcUrl)
		: [{ type: MEDIA_TYPE.VIDEO, url: srcUrl }];
