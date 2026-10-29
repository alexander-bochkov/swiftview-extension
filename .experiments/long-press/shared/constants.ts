export const KEY_CODE = {
	ESCAPE: "Escape",
} as const;

// In px, per axis. Matches the smallest drag threshold of Chromium.
export const MOVE_THRESHOLD = 3;

export const POINTER_BUTTON = {
	AUXILIARY: 1,
	MAIN: 0,
} as const;

export const POINTER_TYPE = {
	MOUSE: "mouse",
	PEN: "pen",
	TOUCH: "touch",
} as const;
