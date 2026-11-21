import type { Nullable } from "@/shared/types";

// Calls back once an element leaves the document, on its own or with an
// ancestor. Pages do remove elements they didn't add: e.g. React, rendering
// the whole document again after a failed hydration, clears the children of
// <html> it doesn't know.
export class RemovalObserver {
	private observer: Nullable<MutationObserver> = null;

	observe(el: Element, onRemove: () => void): void {
		if (this.observer) return;

		this.observer = new MutationObserver(() => {
			if (el.isConnected) return;

			this.disconnect();
			onRemove();
		});

		// An element leaves with a change to the children of its parent, or of
		// a further ancestor it goes with. Only those are watched, not the whole
		// document, which would wake the observer on every change of the page.
		for (let node = el.parentNode; node; node = node.parentNode) {
			this.observer.observe(node, { childList: true });
		}
	}

	disconnect(): void {
		this.observer?.disconnect();
		this.observer = null;
	}
}
