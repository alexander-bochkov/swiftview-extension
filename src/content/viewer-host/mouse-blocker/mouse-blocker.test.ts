import { POINTER_BUTTON } from "@shared/constants";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MouseBlocker } from "./mouse-blocker";

describe("MouseBlocker", () => {
	let blocker: MouseBlocker;
	let host: HTMLElement;
	let root: ShadowRoot;

	const press = (button: number) =>
		new MouseEvent("mousedown", {
			bubbles: true,
			button,
			cancelable: true,
			composed: true,
		});

	const isPrevented = (target: EventTarget, event: Event): boolean => {
		target.dispatchEvent(event);

		return event.defaultPrevented;
	};

	beforeEach(() => {
		host = document.createElement("div");
		root = host.attachShadow({ mode: "open" });
		document.body.append(host);

		blocker = new MouseBlocker();
	});

	afterEach(() => {
		blocker.unblock();
		host.remove();
	});

	it("hides mousedown from the page", () => {
		const listener = vi.fn();
		document.addEventListener("mousedown", listener);

		blocker.block(root);
		document.body.dispatchEvent(press(POINTER_BUTTON.MAIN));
		root.dispatchEvent(press(POINTER_BUTTON.MAIN));

		document.removeEventListener("mousedown", listener);

		expect(listener).not.toHaveBeenCalled();
	});

	describe("scrolling", () => {
		it.each([
			["viewer", () => root],
			["page", () => document.body],
		])("prevents a press of the wheel in the %s", (_, target) => {
			blocker.block(root);

			expect(isPrevented(target(), press(POINTER_BUTTON.AUXILIARY))).toBe(true);
		});

		it("leaves a press of the main button", () => {
			blocker.block(root);

			expect(isPrevented(root, press(POINTER_BUTTON.MAIN))).toBe(false);
		});

		it("is allowed again after unblock", () => {
			blocker.block(root);
			blocker.unblock();

			expect(isPrevented(root, press(POINTER_BUTTON.AUXILIARY))).toBe(false);
		});
	});
});
