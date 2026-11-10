// Unique, so it can't clash with a font of the page.
export const FONT_FAMILY = "SwiftView Inter";

const FONT_PATH = "fonts/inter-variable.woff2";
const FONT_WEIGHT_RANGE = "100 900";

// An @font-face in a shadow root is ignored, so the font is added to the
// document instead, and can be used in the shadow root by its family.
export const createFontFace = (): FontFace =>
	new FontFace(
		FONT_FAMILY,
		`url(${browser.runtime.getURL(FONT_PATH)}) format("woff2")`,
		{ weight: FONT_WEIGHT_RANGE },
	);
