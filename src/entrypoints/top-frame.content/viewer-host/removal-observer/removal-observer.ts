import type { Nullable } from "@/shared/types";

// Calls back once an element is out of the document, also when it goes with
// one of its ancestors. A page may remove what it didn't add, e.g. React clears
// the children of <html> it doesn't know when it renders the whole document
// again after a failed hydration.
export class RemovalObserver {
	private observer: Nullable<MutationObserver> = null;

	observe(element: Node, onRemove: () => void): void {
		if (this.observer) return;

		this.observer = new MutationObserver(() => {
			if (element.isConnected) return;

			this.disconnect();
			onRemove();
		});

		// The children of each ancestor rather than the whole document, so the
		// changes inside the page don't wake the observer up.
		for (let node = element.parentNode; node; node = node.parentNode) {
			this.observer.observe(node, { childList: true });
		}
	}

	disconnect(): void {
		this.observer?.disconnect();
		this.observer = null;
	}
}
