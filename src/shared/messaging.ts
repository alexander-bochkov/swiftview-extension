import { defineExtensionMessaging } from "@webext-core/messaging";
import type { MediaCandidate } from "./types";

// The messages between the background and the content scripts: the data each
// one takes, and what its listener answers.
type ProtocolMap = {
	// To the frame of the menu: the candidates of the media it was opened on,
	// or null without that media.
	findMediaCandidates(srcUrl: string): MediaCandidate[] | null;
	// To the top frame: opens the viewer, unless it is open already.
	openViewer(candidates: readonly MediaCandidate[]): void;
};

export const { onMessage, sendMessage } =
	defineExtensionMessaging<ProtocolMap>();
