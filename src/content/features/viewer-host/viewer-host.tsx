import { injectCSS } from "virtual:css-injected-by-js";
import type { Nullable } from "@shared/types";
import { createRoot, type Root } from "react-dom/client";
import type { PageLock } from "../page-lock";
import { Viewer } from "../viewer";
import { createFontFace } from "./fonts";
import "./viewer-host.css";

export class ViewerHost {
	private readonly pageLock: PageLock;

	private fontFace: Nullable<FontFace> = null;
	private host: Nullable<HTMLElement> = null;
	private root: Nullable<Root> = null;

	constructor(pageLock: PageLock) {
		this.pageLock = pageLock;
	}

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

			this.pageLock.lock(this.host);

			const shadowRoot = this.host.attachShadow({ mode: "closed" });

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
		this.pageLock.unlock();
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
