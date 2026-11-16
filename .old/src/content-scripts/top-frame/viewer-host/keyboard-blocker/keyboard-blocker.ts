import { EventBlocker } from "../event-blocker";

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

// The scroll keys a focused video handles itself: Space plays, the arrows
// seek and change the volume, Home and End jump. The Page keys only scroll.
const VIDEO_KEYS: readonly string[] = [
	" ",
	"ArrowDown",
	"ArrowLeft",
	"ArrowRight",
	"ArrowUp",
	"End",
	"Home",
];

const isScrollKey = (e: KeyboardEvent, root: ShadowRoot): boolean => {
	if (e.type !== "keydown" || !SCROLL_KEYS.includes(e.key)) return false;

	// Browser shortcuts, like Alt+Left to go back.
	if (e.altKey || e.metaKey) return false;

	const { activeElement } = root;

	if (activeElement instanceof HTMLMediaElement) {
		return !VIDEO_KEYS.includes(e.key);
	}

	// Space on a focused button presses it.
	return !(e.key === " " && activeElement instanceof HTMLButtonElement);
};

// Hides the keys from the page and keeps them from scrolling it.
export class KeyboardBlocker extends EventBlocker<
	"keydown" | "keypress" | "keyup"
> {
	constructor() {
		super({
			shouldPrevent: isScrollKey,
			types: ["keydown", "keypress", "keyup"],
		});
	}
}
