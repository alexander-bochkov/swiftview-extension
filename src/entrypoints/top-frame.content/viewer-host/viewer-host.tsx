import type { ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { ContentScriptContext } from "wxt/utils/content-script-context";
import type { MediaCandidate } from "@/shared/types";
import type { ViewerProps } from "../types";
import { cachePromise } from "./cache-promise";
import { exitElementFullscreen } from "./exit-element-fullscreen";
import { ExtensionLossObserver } from "./extension-loss-observer";
import { RemovalObserver } from "./removal-observer";
import { ScrollbarHider } from "./scrollbar-hider";
import { ViewerFont } from "./viewer-font";
import { ViewerIsolator } from "./viewer-isolator";

type State =
	| Readonly<{ status: "closed" }>
	| Readonly<{ status: "open"; ui: ShadowRootContentScriptUi<Root> }>
	| Readonly<{ status: "opening" }>;

const CLOSED: State = { status: "closed" };

export class ViewerHost {
	private readonly ctx: ContentScriptContext;
	private readonly Viewer: ComponentType<ViewerProps>;

	private readonly extensionLossObserver = new ExtensionLossObserver();
	private readonly removalObserver = new RemovalObserver();
	private readonly scrollbarHider = new ScrollbarHider();
	private readonly viewerFont = new ViewerFont();
	private readonly viewerIsolator = new ViewerIsolator();

	// Created on the first open and kept: WXT fetches the styles for each UI,
	// and keeps each one until the context of the script is invalidated.
	private readonly getUi = cachePromise(() =>
		createShadowRootUi(this.ctx, {
			// Found on each open, as a page may replace <html> after the first.
			anchor: () => document.documentElement,
			mode: "closed",
			name: "swiftview-root",
			onMount: (container, shadowRoot) => this.mount(container, shadowRoot),
			onRemove: (root) => this.unmount(root),
			position: "inline",
		}),
	);

	private candidates: MediaCandidate[] = [];
	private state: State = CLOSED;

	constructor(ctx: ContentScriptContext, Viewer: ComponentType<ViewerProps>) {
		this.ctx = ctx;
		this.Viewer = Viewer;
	}

	// True from open() on, while the UI is created, so the viewer isn't opened
	// twice.
	get isOpen(): boolean {
		return this.state.status !== "closed";
	}

	async open(candidates: MediaCandidate[]): Promise<void> {
		this.close();

		// Each open has its own objects, so it can tell when it's been replaced.
		let state: State = { status: "opening" };
		this.state = state;

		try {
			const [ui] = await Promise.all([this.getUi(), exitElementFullscreen()]);

			// Replaced by a close or a newer open, or the context is invalidated:
			// WXT won't remove a UI mounted after that.
			if (this.state !== state || this.ctx.isInvalid) return;

			this.candidates = candidates;
			// Set before mounting: if the mount throws halfway, close() can still
			// remove the UI and undo what was set up.
			state = { status: "open", ui };
			this.state = state;

			ui.mount();
		} catch (error) {
			if (this.state === state) this.handleError(error);
		}
	}

	close(): void {
		if (this.state.status === "open") this.state.ui.remove();

		this.state = CLOSED;
	}

	private mount(container: HTMLElement, shadowRoot: ShadowRoot): Root {
		// The extension is gone: invalidating the context makes WXT remove the UI.
		this.extensionLossObserver.observe(() =>
			this.ctx.abort("Content script context invalidated"),
		);
		this.removalObserver.observe(shadowRoot.host, () => this.close());
		this.scrollbarHider.hide();
		this.viewerFont.add();
		this.viewerIsolator.isolate(shadowRoot);

		container.style.fontFamily = ViewerFont.fontFamily;

		const root = createRoot(container, {
			onUncaughtError: (error) => this.handleError(error),
		});

		root.render(
			<this.Viewer candidates={this.candidates} onClose={() => this.close()} />,
		);

		return root;
	}

	// Also run when WXT removes the UI on its own, once the context of the
	// script is invalidated.
	private unmount(root?: Root): void {
		// Goes first, so nothing during the teardown sees the viewer as open.
		this.state = CLOSED;

		this.extensionLossObserver.disconnect();
		this.removalObserver.disconnect();
		this.scrollbarHider.restore();
		this.viewerFont.remove();
		this.viewerIsolator.release();

		root?.unmount();
	}

	private handleError(error: unknown): void {
		console.error(error);
		this.close();
	}
}
