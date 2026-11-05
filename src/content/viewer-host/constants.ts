import type { EventType } from "@shared/types";

export const BLOCKED_EVENTS = [
	"keydown",
	"keypress",
	"keyup",
	"mousedown",
	"wheel",
] as const satisfies readonly EventType[];
