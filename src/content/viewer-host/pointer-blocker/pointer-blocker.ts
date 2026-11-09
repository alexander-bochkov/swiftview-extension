import { EventBlocker } from "../event-blocker";

// Hides the pointer presses from the page, e.g. from its "click outside"
// handlers. Nothing is prevented, so the listeners are passive. The moves
// aren't hidden: they are many, and the page reacts to them after a press.
export class PointerBlocker extends EventBlocker<"pointerdown" | "pointerup"> {
	constructor() {
		super({ types: ["pointerdown", "pointerup"] });
	}
}
