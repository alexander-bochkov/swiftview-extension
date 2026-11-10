import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PointerBlocker } from "./pointer-blocker";

describe("PointerBlocker", () => {
	let blocker: PointerBlocker;
	let host: HTMLElement;
	let root: ShadowRoot;

	// jsdom has no PointerEvent, and the blocker doesn't read the event.
	const pointer = (type: string) =>
		new Event(type, { bubbles: true, cancelable: true, composed: true });

	beforeEach(() => {
		host = document.createElement("div");
		root = host.attachShadow({ mode: "open" });
		document.body.append(host);

		blocker = new PointerBlocker();
	});

	afterEach(() => {
		blocker.unblock();
		host.remove();
	});

	it.each(["pointerdown", "pointerup"])("hides %s from the page", (type) => {
		const listener = vi.fn();
		document.addEventListener(type, listener);

		blocker.block(root);
		document.body.dispatchEvent(pointer(type));
		root.dispatchEvent(pointer(type));

		document.removeEventListener(type, listener);

		expect(listener).not.toHaveBeenCalled();
	});

	it("lets the presses reach the viewer", () => {
		const listener = vi.fn();
		root.addEventListener("pointerdown", listener);

		blocker.block(root);
		root.dispatchEvent(pointer("pointerdown"));

		expect(listener).toHaveBeenCalledOnce();
	});

	it("leaves the default action to the browser", () => {
		blocker.block(root);
		const e = pointer("pointerdown");
		root.dispatchEvent(e);

		expect(e.defaultPrevented).toBe(false);
	});

	it("leaves the moves to the page", () => {
		const listener = vi.fn();
		document.addEventListener("pointermove", listener);

		blocker.block(root);
		root.dispatchEvent(pointer("pointermove"));

		document.removeEventListener("pointermove", listener);

		expect(listener).toHaveBeenCalledOnce();
	});
});
