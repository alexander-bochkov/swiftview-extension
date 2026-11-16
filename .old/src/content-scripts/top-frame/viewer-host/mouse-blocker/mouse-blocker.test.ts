import { POINTER_BUTTON } from "@shared/constants";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MouseBlocker } from "./mouse-blocker";

const TYPES = [
	"auxclick",
	"click",
	"contextmenu",
	"dblclick",
	"mousedown",
	"mouseup",
] as const;

describe("MouseBlocker", () => {
	let blocker: MouseBlocker;
	let host: HTMLElement;
	let root: ShadowRoot;

	const mouse = (type: string, button: number = POINTER_BUTTON.MAIN) =>
		new MouseEvent(type, {
			bubbles: true,
			button,
			cancelable: true,
			composed: true,
		});

	const press = (button: number) => mouse("mousedown", button);

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

	it.each(TYPES)("hides %s from the page", (type) => {
		const listener = vi.fn();
		document.addEventListener(type, listener);

		blocker.block(root);
		document.body.dispatchEvent(mouse(type));
		root.dispatchEvent(mouse(type));

		document.removeEventListener(type, listener);

		expect(listener).not.toHaveBeenCalled();
	});

	it("leaves the context menu of the browser", () => {
		blocker.block(root);

		expect(isPrevented(root, mouse("contextmenu"))).toBe(false);
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

		it.each(["auxclick", "mouseup"])(
			"leaves %s of the wheel button",
			(type) => {
				blocker.block(root);

				expect(isPrevented(root, mouse(type, POINTER_BUTTON.AUXILIARY))).toBe(
					false,
				);
			},
		);

		it("is allowed again after unblock", () => {
			blocker.block(root);
			blocker.unblock();

			expect(isPrevented(root, press(POINTER_BUTTON.AUXILIARY))).toBe(false);
		});
	});
});
