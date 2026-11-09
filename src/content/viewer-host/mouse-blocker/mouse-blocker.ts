import { POINTER_BUTTON } from "@shared/constants";
import { EventBlocker } from "../event-blocker";

// A press of the wheel would start autoscrolling the page.
const isAuxiliaryPress = (e: MouseEvent): boolean =>
	e.button === POINTER_BUTTON.AUXILIARY;

// Hides the presses of the mouse buttons from the page and keeps them from
// scrolling it.
export class MouseBlocker extends EventBlocker<"mousedown"> {
	constructor() {
		super({ shouldPrevent: isAuxiliaryPress, types: ["mousedown"] });
	}
}
