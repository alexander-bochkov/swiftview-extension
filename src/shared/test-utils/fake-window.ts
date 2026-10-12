import { type Mock, vi } from "vitest";

export type FakeEvent = {
	altKey: boolean;
	button: number;
	clientX: number;
	clientY: number;
	ctrlKey: boolean;
	isPrimary: boolean;
	isTrusted: boolean;
	metaKey: boolean;
	pointerType: string;
	preventDefault: Mock;
	shiftKey: boolean;
	stopImmediatePropagation: Mock;
	type: string;
};

export type FakeWindow = ReturnType<typeof createFakeWindow>;

type Listener = (e: FakeEvent) => void;

type ListenerEntry = {
	listener: Listener;
	type: string;
};

// A DOM event created in a test is never trusted and `isTrusted` can't be
// overridden, so tests dispatch plain objects through this minimal window.
// Capture is ignored: everything is registered on the window itself, so the
// registration order is the dispatch order.
export const createFakeWindow = () => {
	const entries: ListenerEntry[] = [];

	return {
		addEventListener: (
			type: string,
			listener: Listener,
			options: AddEventListenerOptions = {},
		): void => {
			const { signal } = options;

			if (signal?.aborted) return;

			const entry = { listener, type };
			entries.push(entry);

			signal?.addEventListener("abort", () => {
				const index = entries.indexOf(entry);
				if (index !== -1) entries.splice(index, 1);
			});
		},

		dispatch: (type: string, init: Partial<FakeEvent> = {}): FakeEvent => {
			let stopped = false;

			const e: FakeEvent = {
				altKey: false,
				button: 0,
				clientX: 0,
				clientY: 0,
				ctrlKey: false,
				isPrimary: true,
				isTrusted: true,
				metaKey: false,
				pointerType: "mouse",
				preventDefault: vi.fn(),
				shiftKey: false,
				stopImmediatePropagation: vi.fn(() => {
					stopped = true;
				}),
				type,
				...init,
			};

			for (const entry of [...entries]) {
				if (stopped) break;

				// Like in a browser, a listener removed during dispatch is skipped.
				if (entry.type === type && entries.includes(entry)) {
					entry.listener(e);
				}
			}

			return e;
		},

		listenerCount: (): number => entries.length,
	};
};
