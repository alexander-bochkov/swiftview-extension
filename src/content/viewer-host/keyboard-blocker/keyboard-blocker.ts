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

const isScrollKey = (e: KeyboardEvent, root: ShadowRoot): boolean => {
	if (e.type !== "keydown" || !SCROLL_KEYS.includes(e.key)) return false;

	// Browser shortcuts, like Alt+Left to go back.
	if (e.altKey || e.metaKey) return false;

	// Space on a focused button presses it.
	return !(e.key === " " && root.activeElement instanceof HTMLButtonElement);
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
