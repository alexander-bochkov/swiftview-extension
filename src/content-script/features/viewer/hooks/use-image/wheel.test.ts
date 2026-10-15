import { describe, expect, it } from "vitest";
import { getWheelZoomFactor } from "./wheel";

const createWheel = (init: WheelEventInit, wheelDeltaY?: number) => {
	const e = new WheelEvent("wheel", init);

	// jsdom doesn't implement the legacy delta.
	if (wheelDeltaY !== undefined) {
		Object.defineProperty(e, "wheelDeltaY", { value: wheelDeltaY });
	}

	return e;
};

describe("getWheelZoomFactor", () => {
	describe("mouse wheel", () => {
		it("zooms in when spun up", () => {
			const e = createWheel({
				deltaMode: WheelEvent.DOM_DELTA_LINE,
				deltaY: -3,
			});

			expect(getWheelZoomFactor(e)).toBe(1.25);
		});

		it("zooms out when spun down", () => {
			const e = createWheel({
				deltaMode: WheelEvent.DOM_DELTA_LINE,
				deltaY: 3,
			});

			expect(getWheelZoomFactor(e)).toBe(0.8);
		});

		it("zooms by one step whatever the delta", () => {
			const e = createWheel({
				deltaMode: WheelEvent.DOM_DELTA_LINE,
				deltaY: -9,
			});

			expect(getWheelZoomFactor(e)).toBe(1.25);
		});

		it("is recognized by a legacy delta of whole notches", () => {
			const e = createWheel({ deltaY: 100 }, -120);

			expect(getWheelZoomFactor(e)).toBe(0.8);
		});

		it("zooms by steps with the Ctrl key too", () => {
			const e = createWheel({ ctrlKey: true, deltaY: -100 }, 120);

			expect(getWheelZoomFactor(e)).toBe(1.25);
		});
	});

	describe("trackpad", () => {
		it("zooms in on a pinch out", () => {
			const e = createWheel({ ctrlKey: true, deltaY: -10 }, 30);

			expect(getWheelZoomFactor(e)).toBeCloseTo(Math.exp(0.1));
		});

		it("zooms out on a pinch in", () => {
			const e = createWheel({ ctrlKey: true, deltaY: 10 });

			expect(getWheelZoomFactor(e)).toBeCloseTo(Math.exp(-0.1));
		});

		it("does not zoom on scroll", () => {
			const e = createWheel({ deltaY: 10 }, -30);

			expect(getWheelZoomFactor(e)).toBeNull();
		});

		it("does not zoom on a diagonal scroll", () => {
			const e = createWheel({ deltaX: 4, deltaY: 100 }, -120);

			expect(getWheelZoomFactor(e)).toBeNull();
		});
	});

	it("does not zoom without a vertical delta", () => {
		const e = createWheel({ deltaMode: WheelEvent.DOM_DELTA_LINE, deltaX: 3 });

		expect(getWheelZoomFactor(e)).toBeNull();
	});
});
