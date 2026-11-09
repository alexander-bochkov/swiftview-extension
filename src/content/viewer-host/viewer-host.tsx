import { injectCSS } from "virtual:css-injected-by-js";
import type { Nullable } from "@shared/types";
import { createRoot, type Root } from "react-dom/client";
import { Viewer } from "../viewer";
import { createFontFace } from "./fonts";
import "./viewer-host.css";
import { KeyboardBlocker } from "./keyboard-blocker";
import { MouseBlocker } from "./mouse-blocker";
import { PointerBlocker } from "./pointer-blocker";
import { ScrollbarHider } from "./scrollbar-hider";
import { TouchBlocker } from "./touch-blocker";
import { WheelBlocker } from "./wheel-blocker";

export class ViewerHost {
	// Started by init(), see there.
	private readonly earlyBlockers = [
		new KeyboardBlocker(),
		new MouseBlocker(),
		new PointerBlocker(),
		new TouchBlocker(),
	];
	private readonly blockers = [...this.earlyBlockers, new WheelBlocker()];
	private readonly scrollbarHider = new ScrollbarHider();

	private fontFace: Nullable<FontFace> = null;
	private host: Nullable<HTMLElement> = null;
	private root: Nullable<Root> = null;

	get isOpen(): boolean {
		return this.host !== null;
	}

	// Adds the listeners of the blockers before the page adds its own, so they
	// see the events first. Not the wheel: a listener that isn't passive, kept
	// for the life of the page, would slow down its scrolling.
	init(): void {
		for (const blocker of this.earlyBlockers) blocker.init();
	}

	destroy(): void {
		this.close();

		for (const blocker of this.blockers) blocker.destroy();
	}

	open(url: string): void {
		this.close();

		// Rendering errors arrive in onUncaughtError, this catch covers the
		// synchronous ones.
		try {
			this.host = document.createElement("swiftview-root");
			document.documentElement.append(this.host);

			const shadowRoot = this.host.attachShadow({ mode: "closed" });

			for (const blocker of this.blockers) blocker.block(shadowRoot);
			this.scrollbarHider.hide();

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
		for (const blocker of this.blockers) blocker.unblock();
		this.scrollbarHider.restore();

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
