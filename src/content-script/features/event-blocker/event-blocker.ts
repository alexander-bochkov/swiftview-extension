import type { Nullable } from "@shared/types";

type EventType = keyof WindowEventMap;

export class EventBlocker {
	private controller: Nullable<AbortController> = null;

	get isActive(): boolean {
		return this.controller !== null;
	}

	start(types: readonly EventType[]): void {
		if (this.controller) return;

		this.controller = new AbortController();
		const signal = this.controller.signal;

		for (const type of types) {
			window.addEventListener(type, this.handleBlockedEvent, {
				capture: true,
				signal,
			});
		}
	}

	stop(): void {
		this.controller?.abort();
		this.controller = null;
	}

	private handleBlockedEvent = (e: Event): void => {
		e.preventDefault();
		e.stopImmediatePropagation();
	};
}
