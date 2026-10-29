// @vitest-environment node

import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type Mock,
	vi,
} from "vitest";
import {
	createFakeWindow,
	type FakeEvent,
	type FakeWindow,
} from "../../../shared/test-utils";
import { EventBlocker } from "../event-blocker";
import { LongPressRecognizer } from "./long-press-recognizer";

type Options = ConstructorParameters<typeof LongPressRecognizer>[1];

const DELAY = 300;

const BLOCKED_EVENTS = [
	"click",
	"mousemove",
	"mouseup",
	"pointermove",
	"pointerup",
];

const MODIFIERS: Array<[string, Partial<FakeEvent>]> = [
	["alt", { altKey: true }],
	["ctrl", { ctrlKey: true }],
	["meta", { metaKey: true }],
	["shift", { shiftKey: true }],
];

describe("LongPressRecognizer", () => {
	let blocker: EventBlocker;
	let fakeWindow: FakeWindow;
	let onLongPress: Mock<Options["onLongPress"]>;
	let recognizer: LongPressRecognizer;
	let shouldIgnore: Mock<Options["shouldIgnore"]>;

	const press = (init: Partial<FakeEvent> = {}) =>
		fakeWindow.dispatch("pointerdown", init);

	const move = (x: number, y: number) =>
		fakeWindow.dispatch("pointermove", { clientX: x, clientY: y });

	const hold = (init: Partial<FakeEvent> = {}) => {
		press(init);
		vi.advanceTimersByTime(DELAY);
	};

	beforeEach(() => {
		vi.useFakeTimers();

		fakeWindow = createFakeWindow();
		vi.stubGlobal("window", fakeWindow);

		blocker = new EventBlocker();
		onLongPress = vi.fn();
		shouldIgnore = vi.fn(() => false);

		recognizer = new LongPressRecognizer(blocker, {
			delay: DELAY,
			onLongPress,
			shouldIgnore,
		});
		recognizer.enable();
	});

	afterEach(() => {
		recognizer.disable();
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	describe("recognition", () => {
		it("calls onLongPress with the press point after the delay", () => {
			press({ clientX: 10, clientY: 20 });

			vi.advanceTimersByTime(DELAY - 1);
			expect(onLongPress).not.toHaveBeenCalled();

			vi.advanceTimersByTime(1);
			expect(onLongPress).toHaveBeenCalledExactlyOnceWith({ x: 10, y: 20 });
		});

		it("starts blocking before it calls onLongPress", () => {
			let wasBlocking = false;

			onLongPress.mockImplementation(() => {
				wasBlocking = blocker.isActive;
			});

			hold();

			expect(wasBlocking).toBe(true);
		});

		it("fires only once per press", () => {
			hold();
			vi.advanceTimersByTime(DELAY * 3);

			expect(onLongPress).toHaveBeenCalledOnce();
		});

		it("restarts the timer on a second press", () => {
			press({ clientX: 1, clientY: 1 });
			vi.advanceTimersByTime(DELAY - 1);
			press({ clientX: 2, clientY: 2 });
			vi.advanceTimersByTime(DELAY - 1);
			expect(onLongPress).not.toHaveBeenCalled();

			vi.advanceTimersByTime(1);
			expect(onLongPress).toHaveBeenCalledExactlyOnceWith({ x: 2, y: 2 });
		});

		it.each(["pointerup", "pointercancel", "blur"])(
			"does not fire when %s comes before the delay",
			(type) => {
				press();
				vi.advanceTimersByTime(DELAY - 1);
				fakeWindow.dispatch(type);
				vi.advanceTimersByTime(DELAY);

				expect(onLongPress).not.toHaveBeenCalled();
			},
		);
	});

	describe("filters", () => {
		it.each(["pen", "touch"])("ignores %s", (pointerType) => {
			hold({ pointerType });

			expect(onLongPress).not.toHaveBeenCalled();
		});

		it.each([1, 2])("ignores button %i", (button) => {
			hold({ button });

			expect(onLongPress).not.toHaveBeenCalled();
		});

		it("ignores non-primary pointers", () => {
			hold({ isPrimary: false });

			expect(onLongPress).not.toHaveBeenCalled();
		});

		it("ignores untrusted events", () => {
			hold({ isTrusted: false });

			expect(onLongPress).not.toHaveBeenCalled();
		});

		it.each(MODIFIERS)("ignores a press with %s pressed", (_, init) => {
			hold(init);

			expect(onLongPress).not.toHaveBeenCalled();
		});

		it("ignores a press when shouldIgnore returns true", () => {
			shouldIgnore.mockReturnValue(true);

			hold();

			expect(shouldIgnore).toHaveBeenCalledOnce();
			expect(onLongPress).not.toHaveBeenCalled();
		});

		it("keeps a pending press when an ignored event arrives", () => {
			press();
			vi.advanceTimersByTime(DELAY - 1);
			press({ pointerType: "touch" });
			vi.advanceTimersByTime(1);

			expect(onLongPress).toHaveBeenCalledOnce();
		});
	});

	describe("movement", () => {
		it.each([
			[2, 0],
			[0, 2],
			[-2, -2],
		])("keeps the press when the pointer moves by %i, %i", (dx, dy) => {
			press({ clientX: 10, clientY: 10 });
			move(10 + dx, 10 + dy);
			vi.advanceTimersByTime(DELAY);

			expect(onLongPress).toHaveBeenCalledOnce();
		});

		it.each([
			[3, 0],
			[-3, 0],
			[0, 3],
			[0, -3],
			[3, 3],
		])("cancels the press when the pointer moves by %i, %i", (dx, dy) => {
			press({ clientX: 10, clientY: 10 });
			move(10 + dx, 10 + dy);
			vi.advanceTimersByTime(DELAY);

			expect(onLongPress).not.toHaveBeenCalled();
		});

		it("measures from the press point, not along the path", () => {
			press({ clientX: 10, clientY: 10 });
			move(12, 10);
			move(10, 10);
			move(12, 10);
			vi.advanceTimersByTime(DELAY);

			expect(onLongPress).toHaveBeenCalledOnce();
		});

		it("ignores movement when there is no press", () => {
			expect(() => move(100, 100)).not.toThrow();
		});
	});

	describe("blocking", () => {
		it.each(BLOCKED_EVENTS)("blocks %s after a long press", (type) => {
			hold();

			const e = fakeWindow.dispatch(type);

			expect(e.preventDefault).toHaveBeenCalledOnce();
			expect(e.stopImmediatePropagation).toHaveBeenCalledOnce();
		});

		it("does not block events before the long press", () => {
			press();
			vi.advanceTimersByTime(DELAY - 1);

			const e = move(0, 0);

			expect(e.preventDefault).not.toHaveBeenCalled();
		});

		it("does not block events when the press was cancelled", () => {
			press();
			fakeWindow.dispatch("pointerup");
			vi.advanceTimersByTime(DELAY);

			const click = fakeWindow.dispatch("click");

			expect(click.preventDefault).not.toHaveBeenCalled();
		});

		it("keeps blocking the click that follows pointerup", () => {
			hold();

			fakeWindow.dispatch("pointerup");
			fakeWindow.dispatch("mouseup");
			const click = fakeWindow.dispatch("click");

			expect(click.preventDefault).toHaveBeenCalledOnce();
		});

		it("stops blocking on the next task after pointerup", () => {
			hold();

			fakeWindow.dispatch("pointerup");
			vi.advanceTimersByTime(0);
			const click = fakeWindow.dispatch("click");

			expect(blocker.isActive).toBe(false);
			expect(click.preventDefault).not.toHaveBeenCalled();
		});

		it.each(["pointercancel", "blur"])("stops blocking on %s", (type) => {
			hold();

			fakeWindow.dispatch(type);
			const click = fakeWindow.dispatch("click");

			expect(blocker.isActive).toBe(false);
			expect(click.preventDefault).not.toHaveBeenCalled();
		});

		it("stops blocking on the next press", () => {
			hold();

			press();

			expect(blocker.isActive).toBe(false);
		});
	});

	describe("enable and disable", () => {
		it("registers listeners only once when enabled twice", () => {
			const count = fakeWindow.listenerCount();

			recognizer.enable();

			expect(fakeWindow.listenerCount()).toBe(count);
		});

		it("registers blur without capture", () => {
			// Captured blur events of focused elements would cancel every press.
			const addEventListener = vi.spyOn(fakeWindow, "addEventListener");

			recognizer.disable();
			recognizer.enable();

			const blur = addEventListener.mock.calls.find(
				([type]) => type === "blur",
			);
			const down = addEventListener.mock.calls.find(
				([type]) => type === "pointerdown",
			);

			expect(blur?.[2]?.capture).toBeFalsy();
			expect(down?.[2]).toMatchObject({ capture: true });
		});

		it("cancels a pending press when disabled", () => {
			press();

			recognizer.disable();

			expect(vi.getTimerCount()).toBe(0);
			vi.advanceTimersByTime(DELAY);
			expect(onLongPress).not.toHaveBeenCalled();
		});

		it("stops blocking and removes every listener when disabled", () => {
			hold();

			recognizer.disable();

			expect(blocker.isActive).toBe(false);
			expect(fakeWindow.listenerCount()).toBe(0);
		});

		it("can be enabled again after being disabled", () => {
			recognizer.disable();
			recognizer.enable();

			hold();

			expect(onLongPress).toHaveBeenCalledOnce();
		});
	});
});
