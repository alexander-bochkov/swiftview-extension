import type { Nullable, Point } from "@shared/types";

// Per notch of a mouse wheel.
const WHEEL_STEP = 1.25;
// Per px of a pinch.
const PINCH_SENSITIVITY = 0.01;
// The legacy delta of one notch.
const NOTCH_DELTA = 120;

// Non-standard, but available in Chromium, Firefox and Safari.
type LegacyWheelEvent = WheelEvent & { readonly wheelDeltaY?: number };

export type WheelGesture =
	// The factor to multiply the scale by.
	| { readonly factor: number; readonly type: "zoom" }
	// The distance to move the image by, in px.
	| { readonly delta: Point; readonly type: "move" };

// A mouse wheel scrolls by lines in Firefox, and by whole notches of the
// legacy delta in Chromium and Safari. A trackpad scrolls by px in uneven
// steps. Browsers don't tell them apart, so this is a heuristic.
const isMouseWheel = (e: LegacyWheelEvent): boolean => {
	if (e.deltaMode !== WheelEvent.DOM_DELTA_PIXEL) return true;

	const { wheelDeltaY = 0 } = e;

	return e.deltaX === 0 && wheelDeltaY !== 0 && wheelDeltaY % NOTCH_DELTA === 0;
};

// A mouse wheel and a trackpad pinch zoom, scrolling with a trackpad moves.
export const getWheelGesture = (e: WheelEvent): Nullable<WheelGesture> => {
	if (isMouseWheel(e)) {
		if (e.deltaY === 0) return null;

		return { factor: e.deltaY < 0 ? WHEEL_STEP : 1 / WHEEL_STEP, type: "zoom" };
	}

	// Browsers report a trackpad pinch as a wheel with the Ctrl key.
	if (e.ctrlKey) {
		if (e.deltaY === 0) return null;

		return { factor: Math.exp(-e.deltaY * PINCH_SENSITIVITY), type: "zoom" };
	}

	if (e.deltaX === 0 && e.deltaY === 0) return null;

	// Scrolling down shows what is below, so the image moves up.
	return { delta: { x: -e.deltaX, y: -e.deltaY }, type: "move" };
};
