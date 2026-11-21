import type { Nullable } from "@/shared/types";

const CHECK_INTERVAL = 500;

export class ExtensionLossObserver {
	private timer: Nullable<ReturnType<typeof setInterval>> = null;

	observe(onLost: () => void): void {
		if (this.timer) return;

		this.timer = setInterval(() => {
			if (browser.runtime?.id) return;

			this.disconnect();
			onLost();
		}, CHECK_INTERVAL);
	}

	disconnect(): void {
		if (this.timer) clearInterval(this.timer);
		this.timer = null;
	}
}
