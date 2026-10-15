import { act, cleanup, renderHook } from "@testing-library/react";
import type { MouseEvent, PointerEvent } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useDrag } from "./use-drag";

type PointerInit = Partial<
	Pick<
		PointerEvent,
		"button" | "clientX" | "clientY" | "isPrimary" | "pointerId" | "pointerType"
	>
>;

describe("useDrag", () => {
	const onDrag = vi.fn();
	const onDragStart = vi.fn();
	const setPointerCapture = vi.fn();

	// Vitest globals are off, so Testing Library can't register this itself.
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	const renderDrag = () =>
		renderHook(() => useDrag({ onDrag, onDragStart })).result;

	type Rendered = ReturnType<typeof renderDrag>;

	const createPointer = (init: PointerInit = {}) =>
		({
			button: 0,
			clientX: 0,
			clientY: 0,
			currentTarget: { setPointerCapture },
			isPrimary: true,
			pointerId: 1,
			pointerType: "mouse",
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

	const click = (result: Rendered) => {
		const e = { stopPropagation: vi.fn() };
		act(() =>
			result.current.onClickCapture?.(
				e as unknown as MouseEvent<HTMLImageElement>,
			),
		);

		return e;
	};

	describe("press", () => {
		it("starts on the main mouse button and captures the pointer", () => {
			const result = renderDrag();

			down(result, { pointerId: 7 });

			expect(onDragStart).toHaveBeenCalledOnce();
			expect(setPointerCapture).toHaveBeenCalledExactlyOnceWith(7);
		});

		it.each<[string, PointerInit]>([
			["another button", { button: 2 }],
			["a touch", { pointerType: "touch" }],
			["a pen", { pointerType: "pen" }],
			["a secondary pointer", { isPrimary: false }],
		])("ignores %s", (_, init) => {
			const result = renderDrag();

			down(result, init);
			move(result, { clientX: 50 });

			expect(onDragStart).not.toHaveBeenCalled();
			expect(onDrag).not.toHaveBeenCalled();
		});
	});

	describe("move", () => {
		it("reports the distance from the start", () => {
			const result = renderDrag();

			down(result, { clientX: 10, clientY: 20 });
			move(result, { clientX: 15, clientY: 20 });
			move(result, { clientX: 30, clientY: 5 });

			expect(onDrag.mock.calls).toEqual([
				[{ x: 5, y: 0 }],
				[{ x: 20, y: -15 }],
			]);
		});

		it("waits until the pointer moves by 3 px", () => {
			const result = renderDrag();

			down(result);
			move(result, { clientX: 2, clientY: -2 });

			expect(onDrag).not.toHaveBeenCalled();
			expect(result.current.isDragging).toBe(false);

			move(result, { clientX: 2, clientY: -3 });

			expect(onDrag).toHaveBeenCalledExactlyOnceWith({ x: 2, y: -3 });
			expect(result.current.isDragging).toBe(true);
		});

		it("ignores moves without a press", () => {
			const result = renderDrag();

			move(result, { clientX: 50 });

			expect(onDrag).not.toHaveBeenCalled();
		});

		it("ignores moves of another pointer", () => {
			const result = renderDrag();

			down(result, { pointerId: 1 });
			move(result, { clientX: 50, pointerId: 2 });

			expect(onDrag).not.toHaveBeenCalled();
		});
	});

	describe("release", () => {
		it("ends the drag", () => {
			const result = renderDrag();

			down(result);
			move(result, { clientX: 50 });
			up(result, { clientX: 50 });
			move(result, { clientX: 80 });

			expect(onDrag).toHaveBeenCalledOnce();
			expect(result.current.isDragging).toBe(false);
		});

		it("ends the drag on cancel", () => {
			const result = renderDrag();

			down(result);
			move(result, { clientX: 50 });
			act(() => result.current.onPointerCancel?.(createPointer()));

			expect(result.current.isDragging).toBe(false);
		});
	});

	describe("click", () => {
		it("stops the click that ends a drag", () => {
			const result = renderDrag();

			down(result);
			move(result, { clientX: 50 });
			up(result, { clientX: 50 });

			expect(click(result).stopPropagation).toHaveBeenCalledOnce();
		});

		it("stops only one click", () => {
			const result = renderDrag();

			down(result);
			move(result, { clientX: 50 });
			up(result, { clientX: 50 });
			click(result);

			expect(click(result).stopPropagation).not.toHaveBeenCalled();
		});

		it("lets a click without a drag through", () => {
			const result = renderDrag();

			down(result);
			move(result, { clientX: 1 });
			up(result, { clientX: 1 });

			expect(click(result).stopPropagation).not.toHaveBeenCalled();
		});

		it("forgets a drag whose click never came", () => {
			const result = renderDrag();

			down(result);
			move(result, { clientX: 50 });
			up(result, { clientX: 50 });
			down(result);
			up(result);

			expect(click(result).stopPropagation).not.toHaveBeenCalled();
		});
	});
});
