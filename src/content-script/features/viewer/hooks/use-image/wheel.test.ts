import { describe, expect, it } from "vitest";
import { getWheelGesture } from "./wheel";

const LINE = WheelEvent.DOM_DELTA_LINE;

const createWheel = (init: WheelEventInit, wheelDeltaY?: number) => {
	const e = new WheelEvent("wheel", init);

	// jsdom doesn't implement the legacy delta.
	if (wheelDeltaY !== undefined) {
		Object.defineProperty(e, "wheelDeltaY", { value: wheelDeltaY });
	}

	return e;
};

describe("getWheelGesture", () => {
	describe("mouse wheel", () => {
		it("zooms in when spun up", () => {
			const e = createWheel({ deltaMode: LINE, deltaY: -3 });

			expect(getWheelGesture(e)).toEqual({ factor: 1.25, type: "zoom" });
		});

		it("zooms out when spun down", () => {
			const e = createWheel({ deltaMode: LINE, deltaY: 3 });

			expect(getWheelGesture(e)).toEqual({ factor: 0.8, type: "zoom" });
		});

		it("zooms by one step whatever the delta", () => {
			const e = createWheel({ deltaMode: LINE, deltaY: -9 });

			expect(getWheelGesture(e)).toEqual({ factor: 1.25, type: "zoom" });
		});

		it("is recognized by a legacy delta of whole notches", () => {
			const e = createWheel({ deltaY: 100 }, -120);

			expect(getWheelGesture(e)).toEqual({ factor: 0.8, type: "zoom" });
		});

		it("zooms by steps with the Ctrl key too", () => {
			const e = createWheel({ ctrlKey: true, deltaY: -100 }, 120);

			expect(getWheelGesture(e)).toEqual({ factor: 1.25, type: "zoom" });
		});

		it("does nothing when tilted sideways", () => {
			const e = createWheel({ deltaMode: LINE, deltaX: 3 });

			expect(getWheelGesture(e)).toBeNull();
		});
	});

	describe("trackpad", () => {
		it("zooms in on a pinch out", () => {
			const e = createWheel({ ctrlKey: true, deltaY: -10 }, 30);

			expect(getWheelGesture(e)).toEqual({
				factor: expect.closeTo(Math.exp(0.1)),
				type: "zoom",
			});
		});

		it("zooms out on a pinch in", () => {
			const e = createWheel({ ctrlKey: true, deltaY: 10 });

			expect(getWheelGesture(e)).toEqual({
				factor: expect.closeTo(Math.exp(-0.1)),
				type: "zoom",
			});
		});

		it("moves the image against the scroll", () => {
			const e = createWheel({ deltaX: -4, deltaY: 10 }, -30);

			expect(getWheelGesture(e)).toEqual({
				delta: { x: 4, y: -10 },
				type: "move",
			});
		});

		it("moves on a diagonal scroll with a legacy delta of whole notches", () => {
			const e = createWheel({ deltaX: 4, deltaY: 100 }, -120);

			expect(getWheelGesture(e)).toMatchObject({ type: "move" });
		});

		it("does nothing without a delta", () => {
			const e = createWheel({});

			expect(getWheelGesture(e)).toBeNull();
		});
	});
});
