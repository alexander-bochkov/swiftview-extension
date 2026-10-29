// Unique, so it can't clash with a font of the page. Also set in
// viewer-host.css.
export const FONT_FAMILY = "SwiftView Inter";

// In public/fonts, and web accessible in the manifest. A content script
// resolves a relative url against the page, so the url of the extension file
// comes from the runtime.
const FONT_PATH = "fonts/inter-variable.woff2";

// The variable font covers every weight Inter has, so any `font-weight` uses
// its own glyphs rather than a synthesized bold.
const FONT_WEIGHT_RANGE = "100 900";

// An @font-face in a shadow root is ignored, so the font is added to the
// document instead, and can be used in the shadow root by its family.
export const createFontFace = (): FontFace =>
	new FontFace(
		FONT_FAMILY,
		`url(${chrome.runtime.getURL(FONT_PATH)}) format("woff2")`,
		{ weight: FONT_WEIGHT_RANGE },
	);
