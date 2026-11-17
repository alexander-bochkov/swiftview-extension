import { EventBlocker } from "../event-blocker";

// Hides the wheel from the page and keeps it from scrolling the page. The
// viewer handles the wheel itself.
export class WheelBlocker extends EventBlocker<"wheel"> {
	constructor() {
		super({ shouldPrevent: () => true, types: ["wheel"] });
	}
}
