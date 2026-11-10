import type { MESSAGE_TYPE } from "../constants";

type MessageType = (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE];

type Message<Type extends MessageType, Data extends object = object> = Readonly<
	{ type: Type } & Data
>;

export type FindBestMediaUrlMessage = Message<
	typeof MESSAGE_TYPE.FIND_BEST_MEDIA_URL,
	{ srcUrl: string }
>;

export type OpenMediaMessage = Message<
	typeof MESSAGE_TYPE.OPEN_MEDIA,
	{ url: string }
>;
