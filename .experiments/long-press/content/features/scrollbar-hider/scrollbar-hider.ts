import type { Nullable, Point } from "../../../shared/types";

type Style = {
	readonly priority: string;
	readonly property: string;
	readonly value: string;
};

// The viewport grows by the scrollbars, and the page must not move:
// - The width of the vertical one is replaced with padding, so the page
//   doesn't reflow.
// - The scrollable area is extended by the same amount, so a page scrolled to
//   the end isn't scrolled back.
//
// Pages that size things with `vw` may still reflow: `vw` changes with the
// scrollbar, and padding can't help with that.
export class ScrollbarHider {
	private hidden = false;
	private scrollExtender: Nullable<HTMLElement> = null;
	private scrollPosition: Point = { x: 0, y: 0 };
	private styles: Style[] = [];

	hide(): void {
		if (this.hidden) return;

		this.hidden = true;
		this.scrollPosition = { x: window.scrollX, y: window.scrollY };

		const root = document.documentElement;

		// Measured before the styles change, the scrollbars are gone after.
		const scrollbarWidth = window.innerWidth - root.clientWidth;
		const scrollbarHeight = window.innerHeight - root.clientHeight;

		if (scrollbarWidth > 0 || scrollbarHeight > 0) {
			this.extendScrollArea(
				root.scrollWidth + scrollbarWidth,
				root.scrollHeight + scrollbarHeight,
			);
		}

		this.setStyle("scrollbar-width", "none");

		if (scrollbarWidth > 0) {
			const { paddingRight } = getComputedStyle(root);

			this.setStyle(
				"padding-right",
				`${parseFloat(paddingRight) + scrollbarWidth}px`,
			);
		}
	}

	restore(): void {
		if (!this.hidden) return;

		this.hidden = false;

		this.scrollExtender?.remove();
		this.scrollExtender = null;

		this.restoreStyles();
		this.restoreScrollPosition();
	}

	// Without it the largest scroll position shrinks by the scrollbars, and the
	// browser scrolls back a page scrolled to the end. Padding can't do it:
	// content that overflows the root ends past its padding.
	//
	// Positioned from the corner where the page starts, so it ends where the
	// scrollable area must end. A custom element, so the selectors of the page
	// don't match it. Important, so the styles of the page can't override it.
	private extendScrollArea(width: number, height: number): void {
		this.scrollExtender = document.createElement("swiftview-scroll-extender");

		this.scrollExtender.style.cssText = [
			"position: absolute !important",
			"top: 0 !important",
			"left: 0 !important",
			"visibility: hidden !important",
			`width: ${width}px !important`,
			`height: ${height}px !important`,
			"padding: 0 !important",
			"margin: 0 !important",
			"border: 0 !important",
		].join("; ");

		document.documentElement.append(this.scrollExtender);
	}

	// Inline and important, so the styles of the page can't override it. The
	// inline style of the page is saved, to be put back on restore.
	private setStyle(property: string, value: string): void {
		const { style } = document.documentElement;

		this.styles.push({
			priority: style.getPropertyPriority(property),
			property,
			value: style.getPropertyValue(property),
		});

		style.setProperty(property, value, "important");
	}

	private restoreStyles(): void {
		const { style } = document.documentElement;

		// An empty value removes the property, when the page had none.
		this.styles.forEach(({ priority, property, value }) => {
			style.setProperty(property, value, priority);
		});

		this.styles = [];
	}

	// A safety net: the scroll area extension keeps the position, but the page
	// may still move while the viewer is open, e.g. when its content shrinks.
	private restoreScrollPosition(): void {
		const { x, y } = this.scrollPosition;

		if (window.scrollX === x && window.scrollY === y) return;

		window.scrollTo({ behavior: "instant", left: x, top: y });
	}
}
