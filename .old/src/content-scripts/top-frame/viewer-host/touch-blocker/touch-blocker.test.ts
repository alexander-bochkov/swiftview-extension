import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TouchBlocker } from "./touch-blocker";

describe("TouchBlocker", () => {
	let blocker: TouchBlocker;
	let host: HTMLElement;
	let root: ShadowRoot;

	// The blocker doesn't read the event, so a plain one stands for a touch.
	const touch = (type: string) =>
		new Event(type, { bubbles: true, cancelable: true, composed: true });

	beforeEach(() => {
		host = document.createElement("div");
		root = host.attachShadow({ mode: "open" });
		document.body.append(host);

		blocker = new TouchBlocker();
	});

	afterEach(() => {
		blocker.unblock();
		host.remove();
	});

	it.each(["touchstart", "touchend"])("hides %s from the page", (type) => {
		const listener = vi.fn();
		document.addEventListener(type, listener);

		blocker.block(root);
		document.body.dispatchEvent(touch(type));
		root.dispatchEvent(touch(type));

		document.removeEventListener(type, listener);

		expect(listener).not.toHaveBeenCalled();
	});

	it("lets the touches reach the viewer", () => {
		const listener = vi.fn();
		root.addEventListener("touchstart", listener);

		blocker.block(root);
		root.dispatchEvent(touch("touchstart"));

		expect(listener).toHaveBeenCalledOnce();
	});

	it("listens passively, so it can't slow down the scrolling", () => {
		const addEventListener = vi.spyOn(window, "addEventListener");

		blocker.block(root);

		expect(addEventListener).toHaveBeenCalledWith(
			"touchstart",
			expect.any(Function),
			expect.objectContaining({ passive: true }),
		);

		addEventListener.mockRestore();
	});
});
