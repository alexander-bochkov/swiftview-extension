import type { Nullable, Point } from "@shared/types";

export class ContextMenuTracker {
	private controller: Nullable<AbortController> = null;
	private lastPoint: Nullable<Point> = null;

	get point(): Nullable<Point> {
		return this.lastPoint;
	}

	// Captured at the window and registered before the page adds its own
	// listeners, so a page that stops the event at the window still lets it
	// through.
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
