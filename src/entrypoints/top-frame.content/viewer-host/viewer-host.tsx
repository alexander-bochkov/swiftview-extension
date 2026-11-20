import { createRoot, type Root } from "react-dom/client";
import type { ContentScriptContext } from "wxt/utils/content-script-context";
import {
	createShadowRootUi,
	type ShadowRootContentScriptUi,
} from "wxt/utils/content-script-ui/shadow-root";
import type { MediaCandidate, Nullable } from "@/shared/types";
import { MediaViewer } from "../media-viewer";
import { createFontFace } from "./fonts";
import "./viewer-host.css";
import { ExtensionWatcher } from "./extension-watcher";
import { isolateViewer } from "./isolate-viewer";
import { RemovalObserver } from "./removal-observer";
import { ScrollbarHider } from "./scrollbar-hider";

type Ui = ShadowRootContentScriptUi<Root>;

// Chrome takes Escape to exit the fullscreen of an element, and doesn't send
// the key to the page. Over a page element in fullscreen, e.g. a video, the
// viewer wouldn't close, and the fullscreen of its own video would end that
// of the page element too. Only secure pages could lock the key. So the page
// element leaves its fullscreen before the viewer opens. The fullscreen of the
// browser itself (F11) has no element, and stays.
const exitPageFullscreen = async (): Promise<void> => {
	if (!document.fullscreenElement) return;

	try {
		await document.exitFullscreen();
	} catch {
		// Left in the meantime
	}
};

export class ViewerHost {
	private readonly ctx: ContentScriptContext;

	private readonly extensionWatcher = new ExtensionWatcher();
	private readonly removalObserver = new RemovalObserver();
	private readonly scrollbarHider = new ScrollbarHider();

	private candidates: readonly MediaCandidate[] = [];
	private fontFace: Nullable<FontFace> = null;
	private isOpening = false;
	// Set while the UI is in the page.
	private mountedUi: Nullable<Ui> = null;
	// Changed by every open and close, so an open still waiting for the UI can
	// tell it was replaced.
	private session = 0;
	// Set while the UI is in the page, see isolateViewer().
	private stopIsolation: Nullable<() => void> = null;
	// Created on the first open and kept: WXT fetches the styles for each UI,
	// and keeps each one until the context of the script is invalidated.
	private ui: Nullable<Promise<Ui>> = null;

	constructor(ctx: ContentScriptContext) {
		this.ctx = ctx;
	}

	// True from open() on, while the UI is created, so the viewer isn't opened
	// twice.
	get isOpen(): boolean {
		return this.isOpening || this.mountedUi !== null;
	}

	async open(candidates: readonly MediaCandidate[]): Promise<void> {
		this.close();

		const session = this.session;
		this.isOpening = true;

		try {
			const [ui] = await Promise.all([this.getUi(), exitPageFullscreen()]);

			// Closed or opened again while the UI was created, or the extension
			// is gone, see ExtensionWatcher. WXT removed the UI then, before it
			// was mounted, and wouldn't remove it again.
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
			// viewer-host.css resets the host itself. The reset of WXT is
			// !important, so it would also reset the font set there.
			inheritStyles: true,
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
		this.stopIsolation = isolateViewer(shadowRoot);
		this.scrollbarHider.hide();

		// A page may remove the host, see RemovalObserver. The viewer would be
		// gone, but the page would stay blocked, and the viewer would count as
		// open, so it couldn't be opened again.
		this.removalObserver.observe(shadowRoot.host, () => this.close());

		// The extension may go away while the viewer is open, and the viewer
		// would keep the page blocked. Invalidating the context lets WXT remove
		// the UI, as it would for a newer copy of the script, see unmount().
		this.extensionWatcher.watch(() =>
			this.ctx.abort("Content script context invalidated"),
		);

		this.addFont();

		const root = createRoot(container, { onUncaughtError: this.handleError });
		root.render(
			<MediaViewer candidates={this.candidates} onClose={() => this.close()} />,
		);

		return root;
	}

	// Also run when WXT removes the UI on its own, once the context of the
	// script is invalidated.
	private unmount(root: Root | undefined): void {
		this.mountedUi = null;

		this.stopIsolation?.();
		this.stopIsolation = null;
		this.extensionWatcher.stop();
		this.removalObserver.disconnect();
		this.scrollbarHider.restore();

		root?.unmount();

		if (this.fontFace) document.fonts.delete(this.fontFace);
		this.fontFace = null;
	}

	// Without the font, the viewer falls back to sans-serif, see
	// viewer-host.css, so a failure is logged and the viewer stays. A file that
	// fails to load isn't one: the browser loads it on use and falls back itself.
	private addFont(): void {
		try {
			const fontFace = createFontFace();
			document.fonts.add(fontFace);
			this.fontFace = fontFace;
		} catch (error) {
			console.error(error);
		}
	}

	private handleError = (error: unknown): void => {
		console.error(error);
		this.close();
	};
}
