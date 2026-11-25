import type { VideoOptions } from "./types";

export const videoOptions = storage.defineItem<VideoOptions>(
	"sync:options:video",
	{ fallback: { autoplay: false, loop: false, muted: false } },
);
