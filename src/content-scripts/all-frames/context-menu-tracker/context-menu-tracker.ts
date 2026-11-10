import type { Nullable, Point } from "@shared/types";

// Remembers where the frame saw its last context menu open, by a mouse, a long
// press of a touch or a pen. A click on a menu item tells only the url of the
// image, the point tells what else was under it.
//
// The listener is added in init(), before the page adds its own, so a page
// that stops the event at the window still lets it through.
export class ContextMenuTracker {
	private controller: Nullable<AbortController> = null;
	private lastPoint: Nullable<Point> = null;

	// In the coordinates of the viewport of the frame, as
	// document.elementsFromPoint() takes.
	get point(): Nullable<Point> {
		return this.lastPoint;
	}

	init(): void {
		if (this.controller) return;

		this.controller = new AbortController();

		window.addEventListener("contextmenu", this.handleContextMenu, {
			capture: true,
			signal: this.controller.signal,
		});
	}

	destroy(): void {
		this.controller?.abort();
		this.controller = null;
		this.lastPoint = null;
	}

	private handleContextMenu = ({ clientX, clientY }: PointerEvent): void => {
		this.lastPoint = { x: clientX, y: clientY };
	};
}
