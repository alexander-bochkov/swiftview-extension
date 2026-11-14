import type { MediaType } from "../types";

export const MEDIA_TYPE = {
	IMAGE: "image",
	VIDEO: "video",
} as const;

export const MEDIA_TYPES: readonly MediaType[] = Object.values(MEDIA_TYPE);
