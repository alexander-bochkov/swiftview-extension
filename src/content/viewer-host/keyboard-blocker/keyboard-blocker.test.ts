import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KeyboardBlocker } from "./keyboard-blocker";

describe("KeyboardBlocker", () => {
	let blocker: KeyboardBlocker;
	// The viewer: a button in a shadow root, like the toolbar.
	let button: HTMLButtonElement;
	let host: HTMLElement;
	let root: ShadowRoot;

	const isPrevented = (target: EventTarget, event: Event): boolean => {
		target.dispatchEvent(event);

		return event.defaultPrevented;
	};

	const key = (
		type: "keydown" | "keypress" | "keyup",
		key: string,
		init: KeyboardEventInit = {},
	) =>
		new KeyboardEvent(type, {
			bubbles: true,
			cancelable: true,
			composed: true,
			key,
			...init,
		});

	const keyDown = (name: string, init?: KeyboardEventInit) =>
		key("keydown", name, init);

	beforeEach(() => {
		host = document.createElement("div");
		root = host.attachShadow({ mode: "open" });
		button = document.createElement("button");
		root.append(button);
		document.body.append(host);

		blocker = new KeyboardBlocker();
	});

	afterEach(() => {
		blocker.unblock();
		host.remove();
	});

	it.each(["keydown", "keypress", "keyup"] as const)(
		"hides %s from the page",
		(type) => {
			const listener = vi.fn();
			document.addEventListener(type, listener);

			blocker.block(root);
			document.body.dispatchEvent(key(type, "t"));
			root.dispatchEvent(key(type, "t"));

			document.removeEventListener(type, listener);

			expect(listener).not.toHaveBeenCalled();
		},
	);

	describe("scrolling", () => {
		it.each([
			" ",
			"ArrowDown",
			"ArrowLeft",
			"ArrowRight",
			"ArrowUp",
			"End",
			"Home",
			"PageDown",
			"PageUp",
		])("prevents %j in the viewer", (name) => {
			blocker.block(root);

			expect(isPrevented(root, keyDown(name))).toBe(true);
		});

		it("prevents a scroll key in the page", () => {
			blocker.block(root);

			expect(isPrevented(document.body, keyDown("ArrowDown"))).toBe(true);
		});

		it("prevents a scroll key with Ctrl or Shift", () => {
			blocker.block(root);

			expect(isPrevented(root, keyDown("End", { ctrlKey: true }))).toBe(true);
			expect(isPrevented(root, keyDown(" ", { shiftKey: true }))).toBe(true);
		});

		it("lets Space press a focused button of the viewer", () => {
			blocker.block(root);
			button.focus();

			expect(isPrevented(button, keyDown(" "))).toBe(false);
		});

		it("prevents the arrows on a focused button of the viewer", () => {
			blocker.block(root);
			button.focus();

			expect(isPrevented(button, keyDown("ArrowDown"))).toBe(true);
		});

		it.each([
			["Alt", { altKey: true }],
			["Meta", { metaKey: true }],
		])("leaves the browser shortcuts with %s", (_, init) => {
			blocker.block(root);

			expect(isPrevented(root, keyDown("ArrowLeft", init))).toBe(false);
		});

		it("leaves the keys that don't scroll", () => {
			blocker.block(root);

			expect(isPrevented(root, keyDown("Enter"))).toBe(false);
			expect(isPrevented(root, keyDown("t"))).toBe(false);
		});

		it("leaves keypress and keyup of a scroll key", () => {
			blocker.block(root);

			expect(isPrevented(root, key("keypress", " "))).toBe(false);
			expect(isPrevented(root, key("keyup", "ArrowDown"))).toBe(false);
		});

		it("is allowed again after unblock", () => {
			blocker.block(root);
			blocker.unblock();

			expect(isPrevented(root, keyDown("ArrowDown"))).toBe(false);
		});
	});
});
