import { defineExtensionMessaging } from "@webext-core/messaging";
import type { MediaCandidate, Nullable } from "./types";

type ProtocolMap = {
	FIND_MEDIA_CANDIDATES: (srcUrl: string) => Nullable<MediaCandidate[]>;
	OPEN_VIEWER: (candidates: MediaCandidate[]) => boolean;
	PAUSE_MEDIA: () => void;
};

export const { onMessage, sendMessage } =
	defineExtensionMessaging<ProtocolMap>();
