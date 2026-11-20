import { MEDIA_TYPE } from "@/shared/constants";
import type { MediaCandidate, MediaElement, Optional } from "@/shared/types";
import { findLinkedMedia } from "./find-linked-media";
import { findSrcsetImages } from "./find-srcset-images";

const dedupe = (candidates: Optional<MediaCandidate>[]): MediaCandidate[] =>
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

const collectVideoCandidates = (
	video: HTMLVideoElement,
	srcUrl: string,
): MediaCandidate[] =>
	dedupe([findLinkedMedia(video), { type: MEDIA_TYPE.VIDEO, url: srcUrl }]);

export const collectMediaCandidates = (
	el: MediaElement,
	srcUrl: string,
): MediaCandidate[] =>
	el instanceof HTMLImageElement
		? collectImageCandidates(el, srcUrl)
		: collectVideoCandidates(el, srcUrl);
