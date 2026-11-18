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
import { EscapeKeyLock } from "./escape-key-lock";
import { KeyboardBlocker } from "./keyboard-blocker";
import { MouseBlocker } from "./mouse-blocker";
import { PointerBlocker } from "./pointer-blocker";
import { RemovalObserver } from "./removal-observer";
import { ScrollbarHider } from "./scrollbar-hider";
import { TouchBlocker } from "./touch-blocker";
import { WheelBlocker } from "./wheel-blocker";

type Ui = ShadowRootContentScriptUi<Root>;

export class ViewerHost {
	private readonly ctx: ContentScriptContext;

	// Started by init(), see there.
	private readonly earlyBlockers = [
		new KeyboardBlocker(),
		new MouseBlocker(),
		new PointerBlocker(),
		new TouchBlocker(),
	];
	private readonly blockers = [...this.earlyBlockers, new WheelBlocker()];
	private readonly escapeKeyLock = new EscapeKeyLock();
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

	async open(candidates: readonly MediaCandidate[]): Promise<void> {
		this.close();

		const session = this.session;
		this.isOpening = true;

		try {
			const ui = await this.getUi();

			// Closed or opened again while the UI was created.
			if (session !== this.session) return;

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
		for (const blocker of this.blockers) blocker.block(shadowRoot);
		this.escapeKeyLock.lock();
		this.scrollbarHider.hide();

		// A page may remove the host, see RemovalObserver. The viewer would be
		// gone, but the blockers would keep the page blocked, and the viewer
		// would count as open, so it couldn't be opened again.
		this.removalObserver.observe(shadowRoot.host, () => this.close());

		this.fontFace = createFontFace();
		document.fonts.add(this.fontFace);

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

		for (const blocker of this.blockers) blocker.unblock();
		this.escapeKeyLock.unlock();
		this.removalObserver.disconnect();
		this.scrollbarHider.restore();

		root?.unmount();

		if (this.fontFace) document.fonts.delete(this.fontFace);
		this.fontFace = null;
	}

	private handleError = (error: unknown): void => {
		console.error(error);
		this.close();
	};
}
