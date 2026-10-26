import { act, cleanup, renderHook } from "@testing-library/react";
import type { MouseEvent, PointerEvent } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ViewerStore } from "../use-viewer-store";
import { useImageDrag } from "./use-image-drag";

type PointerInit = Partial<
	Pick<
		PointerEvent,
		| "altKey"
		| "button"
		| "clientX"
		| "clientY"
		| "ctrlKey"
		| "isPrimary"
		| "isTrusted"
		| "metaKey"
		| "pointerId"
		| "pointerType"
		| "shiftKey"
	>
>;

describe("useImageDrag", () => {
	const dispatch = vi.fn();
	const setPointerCapture = vi.fn();

	// Vitest globals are off, so Testing Library can't register this itself.
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	const renderDrag = () => {
		const store = { dispatch } as unknown as ViewerStore;

		return renderHook(() => useImageDrag({ store })).result;
	};

	type Rendered = ReturnType<typeof renderDrag>;

	const createPointer = (init: PointerInit = {}) =>
		({
			altKey: false,
			button: 0,
			clientX: 0,
			clientY: 0,
			ctrlKey: false,
			currentTarget: { setPointerCapture },
			isPrimary: true,
			isTrusted: true,
			metaKey: false,
			pointerId: 1,
			pointerType: "mouse",
			shiftKey: false,
			...init,
		}) as unknown as PointerEvent<HTMLImageElement>;

	const down = (result: Rendered, init?: PointerInit) => {
		act(() => result.current.onPointerDown?.(createPointer(init)));
	};

	const move = (result: Rendered, init?: PointerInit) => {
		act(() => result.current.onPointerMove?.(createPointer(init)));
	};

	const up = (result: Rendered, init?: PointerInit) => {
		act(() => result.current.onPointerUp?.(createPointer(init)));
	};

	// Follows both a release and a cancel.
	const lose = (result: Rendered, init?: PointerInit) => {
		act(() => result.current.onLostPointerCapture?.(createPointer(init)));
	};

	const click = (result: Rendered) => {
		const e = { stopPropagation: vi.fn() };
		act(() =>
			result.current.onClickCapture?.(
				e as unknown as MouseEvent<HTMLImageElement>,
			),
		);

		return e;
	};

	const getDeltas = () => dispatch.mock.calls.map(([action]) => action.payload);

	describe("press", () => {
		it("captures the pointer on the main mouse button", () => {
			const result = renderDrag();

			down(result, { pointerId: 7 });

			expect(setPointerCapture).toHaveBeenCalledExactlyOnceWith(7);
		});

		it.each<[string, PointerInit]>([
			["another button", { button: 2 }],
			["a touch", { pointerType: "touch" }],
			["a pen", { pointerType: "pen" }],
			["a secondary pointer", { isPrimary: false }],
			["an event dispatched by a script", { isTrusted: false }],
			["a press with Alt", { altKey: true }],
			["a press with Ctrl", { ctrlKey: true }],
			["a press with Meta", { metaKey: true }],
			["a press with Shift", { shiftKey: true }],
		])("ignores %s", (_, init) => {
			const result = renderDrag();

			down(result, init);
			move(result, { clientX: 50 });

			expect(setPointerCapture).not.toHaveBeenCalled();
			expect(dispatch).not.toHaveBeenCalled();
		});
	});

	describe("move", () => {
		it("moves the image by the distance since the previous move", () => {
			const result = renderDrag();

			down(result, { clientX: 10, clientY: 20 });
			move(result, { clientX: 15, clientY: 20 });
			move(result, { clientX: 30, clientY: 5 });

			expect(dispatch.mock.calls).toEqual([
				[{ payload: { x: 5, y: 0 }, type: "MOVE_BY" }],
				[{ payload: { x: 15, y: -15 }, type: "MOVE_BY" }],
			]);
		});

		it("waits until the pointer moves by 3 px", () => {
			const result = renderDrag();

			down(result);
			move(result, { clientX: 2, clientY: -2 });

			expect(dispatch).not.toHaveBeenCalled();

			move(result, { clientX: 2, clientY: -3 });

			// The first move covers the distance from the press.
			expect(getDeltas()).toEqual([{ x: 2, y: -3 }]);
		});

		it("keeps moving below 3 px once the drag started", () => {
			const result = renderDrag();

			down(result);
			move(result, { clientX: 5 });
			move(result, { clientX: 4 });

			expect(getDeltas()).toEqual([
				{ x: 5, y: 0 },
				{ x: -1, y: 0 },
			]);
		});

		it("ignores moves without a press", () => {
			const result = renderDrag();

			move(result, { clientX: 50 });

			expect(dispatch).not.toHaveBeenCalled();
		});

		it("ignores moves of another pointer", () => {
			const result = renderDrag();

			down(result, { pointerId: 1 });
			move(result, { clientX: 50, pointerId: 2 });

			expect(dispatch).not.toHaveBeenCalled();
		});
	});

	describe("release", () => {
		it("ends the drag when the pointer capture is lost", () => {
			const result = renderDrag();

			down(result);
			move(result, { clientX: 50 });
			up(result, { clientX: 50 });
			lose(result);
			move(result, { clientX: 80 });

			expect(dispatch).toHaveBeenCalledOnce();
		});

		it("ignores a lost capture of another pointer", () => {
			const result = renderDrag();

			down(result, { pointerId: 1 });
			lose(result, { pointerId: 2 });
			move(result, { clientX: 50, pointerId: 1 });

			expect(dispatch).toHaveBeenCalledOnce();
		});
	});

	describe("click", () => {
		it("stops the click that ends a drag", () => {
			const result = renderDrag();

			down(result);
			move(result, { clientX: 50 });
			up(result, { clientX: 50 });
			lose(result);

			expect(click(result).stopPropagation).toHaveBeenCalledOnce();
		});

		it("stops only one click", () => {
			const result = renderDrag();

			down(result);
			move(result, { clientX: 50 });
			up(result, { clientX: 50 });
			lose(result);
			click(result);

			expect(click(result).stopPropagation).not.toHaveBeenCalled();
		});

		it("lets a click without a drag through", () => {
			const result = renderDrag();

			down(result);
			move(result, { clientX: 1 });
			up(result, { clientX: 1 });
			lose(result);

			expect(click(result).stopPropagation).not.toHaveBeenCalled();
		});

		it("lets the click after a cancelled drag through", () => {
			const result = renderDrag();

			// A cancel loses the capture without a release.
			down(result);
			move(result, { clientX: 50 });
			lose(result);

			expect(click(result).stopPropagation).not.toHaveBeenCalled();
		});

		it("forgets a drag whose click never came", () => {
			const result = renderDrag();

			down(result);
			move(result, { clientX: 50 });
			up(result, { clientX: 50 });
			lose(result);
			down(result);
			up(result);
			lose(result);

			expect(click(result).stopPropagation).not.toHaveBeenCalled();
		});
	});
});
