import type { MESSAGE_TYPE } from "../constants";
import type { MediaCandidate } from "./media";

export type FindMediaCandidatesMessage = Readonly<{
	srcUrl: string;
	type: typeof MESSAGE_TYPE.FIND_MEDIA_CANDIDATES;
}>;

export type OpenViewerMessage = Readonly<{
	candidates: readonly MediaCandidate[];
	type: typeof MESSAGE_TYPE.OPEN_VIEWER;
}>;

export type Message = FindMediaCandidatesMessage | OpenViewerMessage;
