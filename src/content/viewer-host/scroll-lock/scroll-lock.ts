import { POINTER_BUTTON } from "@shared/constants";
import type { Nullable, Point } from "@shared/types";

type Style = {
	readonly priority: string;
	readonly property: string;
	readonly value: string;
};

// Keys whose default action scrolls the page. By `key`, not `code`, so the
// numpad arrows with Num Lock off are covered too.
const SCROLL_KEYS: readonly string[] = [
	" ",
	"ArrowDown",
	"ArrowLeft",
	"ArrowRight",
	"ArrowUp",
	"End",
	"Home",
	"PageDown",
	"PageUp",
];

// Keeps the page from moving while the viewer is open. Scrolling is prevented
// per event, as `overflow: hidden` misses pages that scroll an inner element.
// The hidden scrollbars are made up for with padding and a larger scroll area,
// though pages sized with `vw` may still reflow.
export class ScrollLock {
	private controller: Nullable<AbortController> = null;
	private root: Nullable<ShadowRoot> = null;
	private scrollExtender: Nullable<HTMLElement> = null;
	private scrollPosition: Point = { x: 0, y: 0 };
	private styles: Style[] = [];

	lock(root: ShadowRoot): void {
		if (this.controller) return;

		this.root = root;

		this.controller = new AbortController();
		const signal = this.controller.signal;

		const options = {
			capture: true,
			// Not passive, otherwise the wheel can't be prevented.
			passive: false,
			signal,
		};

		window.addEventListener("keydown", this.handleKeyDown, options);
		window.addEventListener("mousedown", this.handleMouseDown, options);
		window.addEventListener("wheel", this.handleWheel, options);

		this.hideScrollbars();
	}

	unlock(): void {
		if (!this.controller) return;

		this.controller.abort();
		this.controller = null;
		this.root = null;

		this.scrollExtender?.remove();
		this.scrollExtender = null;

		this.restoreStyles();
		this.restoreScrollPosition();
	}

	private handleKeyDown = (e: KeyboardEvent): void => {
		if (!SCROLL_KEYS.includes(e.key)) return;

		// Browser shortcuts, like Alt+Left to go back.
		if (e.altKey || e.metaKey) return;

		// Space on a focused button presses it.
		const isButtonPress =
			e.key === " " && this.root?.activeElement instanceof HTMLButtonElement;

		if (!isButtonPress) e.preventDefault();
	};

	private handleMouseDown = (e: MouseEvent): void => {
		if (e.button === POINTER_BUTTON.AUXILIARY) e.preventDefault();
	};

	private handleWheel = (e: WheelEvent): void => {
		e.preventDefault();
	};

	private hideScrollbars(): void {
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

	// Otherwise a page scrolled to the end is scrolled back by the scrollbar
	// size. A custom element with important styles, so the page can't style it.
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

	// A safety net, in case the page moved anyway, e.g. its content shrank.
	private restoreScrollPosition(): void {
		const { x, y } = this.scrollPosition;

		if (window.scrollX === x && window.scrollY === y) return;

		window.scrollTo({ behavior: "instant", left: x, top: y });
	}
}
