import { injectCSS } from "virtual:css-injected-by-js";
import type { Nullable } from "@shared/types";
import { createRoot, type Root } from "react-dom/client";
import { Viewer } from "../viewer";
import { createFontFace } from "./fonts";
import "./viewer-host.css";
import { BLOCKED_EVENTS } from "./constants";
import { EventBlocker } from "./event-blocker";
import { ScrollLock } from "./scroll-lock";

export class ViewerHost {
	private readonly eventBlocker = new EventBlocker();
	private readonly scrollLock = new ScrollLock();

	private fontFace: Nullable<FontFace> = null;
	private host: Nullable<HTMLElement> = null;
	private root: Nullable<Root> = null;

	get isOpen(): boolean {
		return this.host !== null;
	}

	open(url: string): void {
		this.close();

		// Rendering errors arrive in onUncaughtError, this catch covers the
		// synchronous ones.
		try {
			this.host = document.createElement("swiftview-root");
			document.documentElement.append(this.host);

			const shadowRoot = this.host.attachShadow({ mode: "closed" });

			// Before the blocker, which stops the events of the page at the window,
			// where the lock prevents them from scrolling.
			this.scrollLock.lock(shadowRoot);
			this.eventBlocker.block(BLOCKED_EVENTS, this.host);

			injectCSS({ target: shadowRoot });

			this.fontFace = createFontFace();
			document.fonts.add(this.fontFace);

			this.root = createRoot(shadowRoot, { onUncaughtError: this.handleError });
			this.root.render(<Viewer onClose={() => this.close()} url={url} />);
		} catch (error) {
			this.handleError(error);
		}
	}

	close(): void {
		this.eventBlocker.unblock();
		this.scrollLock.unlock();

		this.root?.unmount();
		this.host?.remove();

		if (this.fontFace) document.fonts.delete(this.fontFace);

		this.fontFace = null;
		this.root = null;
		this.host = null;
	}

	private handleError = (error: unknown): void => {
		console.error(error);
		this.close();
	};
}
