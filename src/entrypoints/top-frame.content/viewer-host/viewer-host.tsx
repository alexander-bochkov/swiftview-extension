import type { ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { ContentScriptContext } from "wxt/utils/content-script-context";
import type { MediaCandidate, Nullable } from "@/shared/types";
import type { ViewerProps } from "../types";
import { exitElementFullscreen } from "./exit-element-fullscreen";
import { ExtensionLossObserver } from "./extension-loss-observer";
import { RemovalObserver } from "./removal-observer";
import { ScrollbarHider } from "./scrollbar-hider";
import { ViewerFont } from "./viewer-font";
import { ViewerIsolator } from "./viewer-isolator";

type Ui = ShadowRootContentScriptUi<Root>;

export class ViewerHost {
	private readonly ctx: ContentScriptContext;
	private readonly Viewer: ComponentType<ViewerProps>;

	private readonly extensionLossObserver = new ExtensionLossObserver();
	private readonly removalObserver = new RemovalObserver();
	private readonly scrollbarHider = new ScrollbarHider();
	private readonly viewerFont = new ViewerFont();
	private readonly viewerIsolator = new ViewerIsolator();

	private candidates: MediaCandidate[] = [];
	private isOpening = false;
	// Set while the UI is in the page.
	private mountedUi: Nullable<Ui> = null;
	// Changed by every open and close, so an open still waiting for the UI can
	// tell it was replaced.
	private session = 0;
	// Created on the first open and kept: WXT fetches the styles for each UI,
	// and keeps each one until the context of the script is invalidated.
	private ui: Nullable<Promise<Ui>> = null;

	constructor(ctx: ContentScriptContext, Viewer: ComponentType<ViewerProps>) {
		this.ctx = ctx;
		this.Viewer = Viewer;
	}

	// True from open() on, while the UI is created, so the viewer isn't opened
	// twice.
	get isOpen(): boolean {
		return this.isOpening || this.mountedUi !== null;
	}

	async open(candidates: MediaCandidate[]): Promise<void> {
		this.close();

		const session = this.session;
		this.isOpening = true;

		try {
			const [ui] = await Promise.all([this.getUi(), exitElementFullscreen()]);

			// Closed or opened again while the UI was created, or the extension
			// is gone, see ExtensionLossObserver. WXT removed the UI then, before
			// it was mounted, and wouldn't remove it again.
			if (session !== this.session || this.ctx.isInvalid) return;

			this.isOpening = false;
			this.candidates = candidates;
			this.mountedUi = ui;
			// Rendering errors arrive in onUncaughtError, the catch covers the
			// synchronous ones.
			ui.mount();
		} catch (error) {
			if (session === this.session) this.handleError(error);
		}
	}

	close(): void {
		this.session++;
		this.isOpening = false;

		this.mountedUi?.remove();
	}

	private getUi(): Promise<Ui> {
		this.ui ??= createShadowRootUi(this.ctx, {
			// Found on each open: a page may replace <html>, and the UI would be
			// added to the old one, out of the document.
			anchor: () => document.documentElement,
			mode: "closed",
			name: "swiftview-root",
			onMount: (container, shadowRoot) => this.mount(container, shadowRoot),
			onRemove: (root) => this.unmount(root),
			position: "inline",
		}).catch((error: unknown) => {
			// Created again on the next open.
			this.ui = null;
			throw error;
		});

		return this.ui;
	}

	private mount(container: HTMLElement, shadowRoot: ShadowRoot): Root {
		this.viewerIsolator.isolate(shadowRoot);
		this.scrollbarHider.hide();

		// A page may remove the host, see RemovalObserver. The viewer would be
		// gone, but the page would stay blocked, and the viewer would count as
		// open, so it couldn't be opened again.
		this.removalObserver.observe(shadowRoot.host, () => this.close());

		// The extension may go away while the viewer is open, and the viewer
		// would keep the page blocked. Invalidating the context lets WXT remove
		// the UI, as it would for a newer copy of the script, see unmount().
		this.extensionLossObserver.observe(() =>
			this.ctx.abort("Content script context invalidated"),
		);

		this.viewerFont.add();
		// On the container, as WXT resets the host with `all: initial
		// !important`. The page can't reach it in the closed shadow root.
		container.style.fontFamily = ViewerFont.fontFamily;

		const root = createRoot(container, { onUncaughtError: this.handleError });
		root.render(
			<this.Viewer candidates={this.candidates} onClose={() => this.close()} />,
		);

		return root;
	}

	// Also run when WXT removes the UI on its own, once the context of the
	// script is invalidated.
	private unmount(root: Root | undefined): void {
		this.mountedUi = null;

		this.viewerIsolator.release();
		this.extensionLossObserver.disconnect();
		this.removalObserver.disconnect();
		this.scrollbarHider.restore();

		root?.unmount();

		this.viewerFont.remove();
	}

	private handleError = (error: unknown): void => {
		console.error(error);
		this.close();
	};
}
