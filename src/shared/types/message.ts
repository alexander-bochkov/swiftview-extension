import type { MESSAGE_TYPE } from "../constants";

type MessageType = (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE];

type Message<Type extends MessageType, Data extends object = object> = Readonly<
	{ type: Type } & Data
>;

export type OpenImageMessage = Message<
	typeof MESSAGE_TYPE.OPEN_IMAGE,
	{ url: string }
>;
