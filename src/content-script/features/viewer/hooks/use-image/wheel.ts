import type { Nullable } from "@shared/types";

// Per notch of a mouse wheel.
const WHEEL_STEP = 1.25;
// Per px of a pinch.
const PINCH_SENSITIVITY = 0.01;
// The legacy delta of one notch.
const NOTCH_DELTA = 120;

// Non-standard, but available in Chromium, Firefox and Safari.
type LegacyWheelEvent = WheelEvent & { readonly wheelDeltaY?: number };

// A mouse wheel scrolls by lines in Firefox, and by whole notches of the
// legacy delta in Chromium and Safari. A trackpad scrolls by px in uneven
// steps. Browsers don't tell them apart, so this is a heuristic.
const isMouseWheel = (e: LegacyWheelEvent): boolean => {
	if (e.deltaMode !== WheelEvent.DOM_DELTA_PIXEL) return true;

	const { wheelDeltaY = 0 } = e;

	return e.deltaX === 0 && wheelDeltaY !== 0 && wheelDeltaY % NOTCH_DELTA === 0;
};

// The factor to multiply the scale by, or null when the wheel doesn't zoom.
export const getWheelZoomFactor = (e: WheelEvent): Nullable<number> => {
	if (e.deltaY === 0) return null;

	if (isMouseWheel(e)) return e.deltaY < 0 ? WHEEL_STEP : 1 / WHEEL_STEP;

	// Browsers report a trackpad pinch as a wheel with the Ctrl key.
	if (e.ctrlKey) return Math.exp(-e.deltaY * PINCH_SENSITIVITY);

	// Scrolling with a trackpad is left for moving the image.
	return null;
};
