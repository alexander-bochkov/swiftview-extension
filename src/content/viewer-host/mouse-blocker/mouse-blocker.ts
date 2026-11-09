import { POINTER_BUTTON } from "@shared/constants";
import { EventBlocker } from "../event-blocker";

// A press of the wheel would start autoscrolling the page.
const isAuxiliaryPress = (e: MouseEvent): boolean =>
	e.type === "mousedown" && e.button === POINTER_BUTTON.AUXILIARY;

// Hides the mouse buttons from the page, e.g. from its "click outside"
// handlers or its own context menu, and keeps them from scrolling it. The
// context menu of the browser is left to it.
export class MouseBlocker extends EventBlocker<
	"auxclick" | "click" | "contextmenu" | "dblclick" | "mousedown" | "mouseup"
> {
	constructor() {
		super({
			shouldPrevent: isAuxiliaryPress,
			types: [
				"auxclick",
				"click",
				"contextmenu",
				"dblclick",
				"mousedown",
				"mouseup",
			],
		});
	}
}
