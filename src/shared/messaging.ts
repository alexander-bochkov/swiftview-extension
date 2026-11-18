import { defineExtensionMessaging } from "@webext-core/messaging";
import type { MediaCandidate } from "./types";

type ProtocolMap = {
	FIND_MEDIA_CANDIDATES: (srcUrl: string) => MediaCandidate[] | null;
	OPEN_VIEWER: (candidates: readonly MediaCandidate[]) => void;
};

export const { onMessage, sendMessage } =
	defineExtensionMessaging<ProtocolMap>();
