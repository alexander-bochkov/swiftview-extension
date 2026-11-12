import type { MESSAGE_TYPE } from "../constants";
import type { MediaCandidate } from "./media";

type MessageType = (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE];

type Message<Type extends MessageType, Data extends object = object> = Readonly<
	{ type: Type } & Data
>;

export type FindMediaCandidatesMessage = Message<
	typeof MESSAGE_TYPE.FIND_MEDIA_CANDIDATES,
	{ srcUrl: string }
>;

export type OpenViewerMessage = Message<
	typeof MESSAGE_TYPE.OPEN_VIEWER,
	{ candidates: readonly MediaCandidate[] }
>;
