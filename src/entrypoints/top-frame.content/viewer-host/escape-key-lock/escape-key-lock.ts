import type { Nullable } from "@/shared/types";

// The part of the Keyboard Lock API used here, which the DOM types of
// TypeScript don't have yet. Only in secure contexts, so not on http pages.
type Keyboard = {
	lock: (keyCodes: string[]) => Promise<void>;
	unlock: () => void;
};

const getKeyboard = (): Keyboard | undefined =>
	(navigator as Navigator & { keyboard?: Keyboard }).keyboard;

// Chrome takes Escape to exit fullscreen, and doesn't send the key to the
// page. It also exits the fullscreen of every element at once, so the viewer
// above a page element in fullscreen wouldn't close, and the fullscreen of
// its own video would end the one of the page below. Locked, a press of
// Escape reaches the page, and holding it still exits the fullscreen. While
// anything is in fullscreen, so the viewer handles the key: the video viewer
// exits the fullscreen of its video, the viewer closes otherwise.
export class EscapeKeyLock {
	private controller: Nullable<AbortController> = null;
	private isLocked = false;

	lock(): void {
		if (this.controller) return;

		this.controller = new AbortController();

		// Fired at the element and composed, so it reaches the document from the
		// viewer too. In the capture phase, so the page can't stop it.
		document.addEventListener("fullscreenchange", this.update, {
			capture: true,
			signal: this.controller.signal,
		});

		this.update();
	}

	unlock(): void {
		this.controller?.abort();
		this.controller = null;

		this.setLocked(false);
	}

	private update = (): void => {
		this.setLocked(document.fullscreenElement !== null);
	};

	// Unlocks only what it locked, so a lock of the page itself is left alone
	// while there's nothing to lock.
	private setLocked(isLocked: boolean): void {
		const keyboard = getKeyboard();

		if (!keyboard || isLocked === this.isLocked) return;

		this.isLocked = isLocked;

		if (!isLocked) {
			keyboard.unlock();
			return;
		}

		keyboard.lock(["Escape"]).catch(() => {
			// Refused, e.g. by a policy. Escape exits the fullscreen as before.
			this.isLocked = false;
		});
	}
}
