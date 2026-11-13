import type { Nullable } from "@shared/types";

type EventType = keyof WindowEventMap;

export type EventBlockerPolicy<Type extends EventType> = {
	readonly types: readonly Type[];
	// Whether the default action is prevented, for the events of the page and
	// of the viewer alike. The root is the shadow root of the viewer.
	readonly shouldPrevent?: (
		e: WindowEventMap[Type],
		root: ShadowRoot,
	) => boolean;
};

// Hides events from the page while the viewer is open. Events of the page stop
// at the window. Events of the viewer reach the viewer, then stop at its host,
// before the page listeners above it.
//
// Capture listeners of the window run in the order they were added, so page
// listeners added there before the blocker still see the events. init() adds
// the listeners of the blocker early, before the page adds its own, and keeps
// them until destroy(). Without init(), they are added by block() and removed
// by unblock().
export class EventBlocker<Type extends EventType> {
	private readonly policy: EventBlockerPolicy<Type>;

	private controller: Nullable<AbortController> = null;
	private isInitialized = false;
	private root: Nullable<ShadowRoot> = null;

	constructor(policy: EventBlockerPolicy<Type>) {
		this.policy = policy;
	}

	init(): void {
		this.isInitialized = true;
		this.listen();
	}

	destroy(): void {
		this.isInitialized = false;
		this.unblock();
	}

	block(root: ShadowRoot): void {
		if (this.root) return;

		this.root = root;
		this.listen();

		for (const type of this.policy.types) {
			// No signal: the viewer may close while one of its events is still
			// being dispatched (Escape, a click on the backdrop). unblock() would
			// remove the listener before the event bubbles to the host, and the
			// page would see it. The listeners go away with the host.
			root.host.addEventListener(type, this.handleHostEvent);
		}
	}

	unblock(): void {
		this.root = null;

		if (this.isInitialized) return;

		this.controller?.abort();
		this.controller = null;
	}

	private listen(): void {
		if (this.controller) return;

		this.controller = new AbortController();
		const { signal } = this.controller;

		for (const type of this.policy.types) {
			window.addEventListener(type, this.handleWindowEvent, {
				capture: true,
				// Not passive when preventing, otherwise the wheel can't be prevented.
				passive: !this.policy.shouldPrevent,
				signal,
			});
		}
	}

	private handleWindowEvent = (e: Event): void => {
		if (!this.root) return;

		// The type is one of the policy, as only those are listened to.
		if (this.policy.shouldPrevent?.(e as WindowEventMap[Type], this.root)) {
			e.preventDefault();
		}

		if (e.composedPath().includes(this.root.host)) return;

		e.stopImmediatePropagation();
	};

	private handleHostEvent = (e: Event): void => {
		e.stopPropagation();
	};
}
