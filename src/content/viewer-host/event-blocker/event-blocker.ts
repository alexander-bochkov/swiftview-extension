import type { EventType, Nullable } from "@shared/types";

export class EventBlocker {
	private controller: Nullable<AbortController> = null;
	private host: Nullable<Element> = null;

	block(eventTypes: readonly EventType[], host: Element): void {
		if (this.controller) return;

		this.host = host;

		this.controller = new AbortController();
		const { signal } = this.controller;

		for (const type of eventTypes) {
			window.addEventListener(type, this.handlePageEvent, {
				capture: true,
				signal,
			});

			// The events of the host reach its content first, then stop here,
			// before the page listeners above it.
			//
			// No signal: the host may close while one of its events is still being
			// dispatched (Escape, a click on the backdrop). unblock() would remove
			// the listener before the event bubbles to the host, and the page would
			// see it. The listeners go away with the host.
			host.addEventListener(type, this.handleHostEvent);
		}
	}

	unblock(): void {
		this.controller?.abort();
		this.controller = null;
		this.host = null;
	}

	private handlePageEvent = (e: Event): void => {
		if (this.host && e.composedPath().includes(this.host)) return;

		e.stopImmediatePropagation();
	};

	private handleHostEvent = (e: Event): void => {
		e.stopPropagation();
	};
}
