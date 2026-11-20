import type { Nullable } from "@/shared/types";

// Often enough that the viewer doesn't linger after the extension is gone.
// Only a property read, and only while watched.
const CHECK_INTERVAL = 500;

// Calls back once the extension is gone: updated, reloaded, disabled or
// uninstalled. Chrome leaves the script in the page with no event, and WXT
// notices only when a newer copy of the script starts, which Chrome doesn't
// inject into open tabs. What changes is the id of the extension, which Chrome
// takes from the script, so it's checked on an interval.
//
// A port to the background doesn't tell: Chrome closes it before it takes the
// id, the same as when the service worker stops, and a port connected again
// from the script then never closes.
export class ExtensionWatcher {
	private timer: Nullable<ReturnType<typeof setInterval>> = null;

	watch(onLost: () => void): void {
		if (this.timer) return;

		this.timer = setInterval(() => {
			if (browser.runtime?.id) return;

			this.stop();
			onLost();
		}, CHECK_INTERVAL);
	}

	stop(): void {
		if (this.timer) clearInterval(this.timer);
		this.timer = null;
	}
}
