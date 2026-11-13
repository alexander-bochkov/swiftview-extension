import type { MEDIA_TYPE } from "../constants";

export type MediaElement = HTMLImageElement | HTMLVideoElement;

export type MediaType = (typeof MEDIA_TYPE)[keyof typeof MEDIA_TYPE];

export type MediaCandidate = Readonly<{
	type: MediaType;
	url: string;
}>;
