import type { Nullable } from "@/shared/types";

// Unique, so it can't clash with a font of the page.
const FONT_FAMILY = "SwiftView Inter";
const FONT_PATH = "/fonts/inter-variable.woff2";
const FONT_WEIGHT_RANGE = "100 900";

export class ViewerFont {
	static readonly fontFamily = `"${FONT_FAMILY}", sans-serif`;

	private fontFace: Nullable<FontFace> = null;

	add(): void {
		try {
			this.fontFace ??= new FontFace(
				FONT_FAMILY,
				`url(${browser.runtime.getURL(FONT_PATH)}) format("woff2")`,
				{ weight: FONT_WEIGHT_RANGE },
			);

			document.fonts.add(this.fontFace);
		} catch (error) {
			console.error(error);
		}
	}

	remove(): void {
		if (this.fontFace) document.fonts.delete(this.fontFace);
	}
}
