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

		this.host = document.createElement("swiftview-root");
		document.documentElement.appendChild(this.host);

		const shadowRoot = this.host.attachShadow({ mode: "closed" });

		injectCSS({ target: shadowRoot });

		this.root = createRoot(shadowRoot, {
			onUncaughtError: (error) => {
				console.error(error);
				this.close();
			},
		});

		this.root.render(<Viewer onClose={() => this.close()} url={url} />);
	}

	close(): void {
		this.root?.unmount();
		this.host?.remove();

		this.root = null;
		this.host = null;
	}
}
