import { injectCSS } from "virtual:css-injected-by-js";
import type { Nullable } from "@shared/types";
import { createRoot, type Root } from "react-dom/client";
import { Viewer } from "../viewer";

export class ViewerHost {
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

			injectCSS({ target: shadowRoot });

			this.root = createRoot(shadowRoot, { onUncaughtError: this.handleError });
			this.root.render(<Viewer onClose={() => this.close()} url={url} />);
		} catch (error) {
			this.handleError(error);
		}
	}

	close(): void {
		this.root?.unmount();
		this.host?.remove();

		this.root = null;
		this.host = null;
	}

	private handleError = (error: unknown): void => {
		console.error(error);
		this.close();
	};
}
