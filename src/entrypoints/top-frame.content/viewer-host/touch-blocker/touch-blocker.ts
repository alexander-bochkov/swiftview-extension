import { EventBlocker } from "../event-blocker";

// Hides the touches from the page, e.g. from its "click outside" handlers.
// Nothing is prevented, so the listeners are passive and don't slow down the
// scrolling of the page. Touch scrolling is prevented by the `touch-action` of
// the viewer instead.
export class TouchBlocker extends EventBlocker<"touchend" | "touchstart"> {
	constructor() {
		super({ types: ["touchend", "touchstart"] });
	}
}
