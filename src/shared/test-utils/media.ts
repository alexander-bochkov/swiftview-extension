import { MEDIA_TYPE } from "@/shared/constants";
import type { MediaCandidate } from "@/shared/types";

// A video and an image for the tests.
export const CLIP_URL = "https://example.com/clip.mp4";
export const PHOTO_URL = "https://example.com/photo.png";

export const CLIP: MediaCandidate = { type: MEDIA_TYPE.VIDEO, url: CLIP_URL };
export const PHOTO: MediaCandidate = { type: MEDIA_TYPE.IMAGE, url: PHOTO_URL };
