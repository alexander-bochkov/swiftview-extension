import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WheelBlocker } from "./wheel-blocker";

describe("WheelBlocker", () => {
	let blocker: WheelBlocker;
	let host: HTMLElement;
	let root: ShadowRoot;

	const wheel = () =>
		new WheelEvent("wheel", {
			bubbles: true,
			cancelable: true,
			composed: true,
			deltaY: 100,
		});

	const isPrevented = (target: EventTarget, event: Event): boolean => {
		target.dispatchEvent(event);

		return event.defaultPrevented;
	};

	beforeEach(() => {
		host = document.createElement("div");
		root = host.attachShadow({ mode: "open" });
		document.body.append(host);

		blocker = new WheelBlocker();
	});

	afterEach(() => {
		blocker.unblock();
		host.remove();
	});

	it("hides the wheel from the page", () => {
		const listener = vi.fn();
		document.addEventListener("wheel", listener);

		blocker.block(root);
		document.body.dispatchEvent(wheel());
		root.dispatchEvent(wheel());

		document.removeEventListener("wheel", listener);

		expect(listener).not.toHaveBeenCalled();
	});

	it("lets the wheel reach the viewer", () => {
		const listener = vi.fn();
		root.addEventListener("wheel", listener);

		blocker.block(root);
		root.dispatchEvent(wheel());

		expect(listener).toHaveBeenCalledOnce();
	});

	it.each([
		["viewer", () => root],
		["page", () => document.body],
	])("prevents the wheel in the %s", (_, target) => {
		blocker.block(root);

		expect(isPrevented(target(), wheel())).toBe(true);
	});

	it("is allowed again after unblock", () => {
		blocker.block(root);
		blocker.unblock();

		expect(isPrevented(root, wheel())).toBe(false);
	});
});
