import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ImageViewer } from "./image-viewer";

// The buttons contain only an icon, so render its name to make them queryable.
vi.mock("../components/icon", async (importOriginal) => ({
	...(await importOriginal<typeof import("../components/icon")>()),
	Icon: ({ name }: { name: string }) => name,
}));

type Size = { height: number; width: number };

// An image of 400x200 in a container of 500x100 fits at 50%. The layout box
// sits at 0, 0 in the natural size, so the fitted image is moved by 50, -50.
const CONTAINER: Size = { height: 100, width: 500 };
const IMAGE: Size = { height: 200, width: 400 };

// The transform of the box as numbers. It isn't compared as a string, as
// jsdom serializes it in its shortest form, e.g. `scale(0.5, 0.5)` as
// `scale(0.5)`, and that form can change between versions.
const getTransform = ({ style }: HTMLElement) => {
	const getArgs = (name: string): number[] =>
		style.transform
			.match(new RegExp(`\\b${name}\\(([^)]*)\\)`))?.[1]
			?.split(",")
			.map((arg) => parseFloat(arg)) ?? [];

	const [x = 0, y = 0] = getArgs("translate");
	const [scaleX = 1, scaleY = scaleX] = getArgs("scale");
	const [rotation = 0] = getArgs("rotate");

	return { rotation, scale: [scaleX, scaleY], translate: [x, y] };
};

describe("ImageViewer", () => {
	const onClose = vi.fn();
	let notifyResize: (size: Size) => void;

	// jsdom doesn't implement animations. No transitions by default.
	const getBoxAnimations = vi.fn((): Animation[] => []);

	beforeEach(() => {
		// jsdom doesn't implement ResizeObserver, so capture the callback and
		// let the tests report the container size themselves.
		vi.stubGlobal(
			"ResizeObserver",
			class {
				constructor(callback: ResizeObserverCallback) {
					notifyResize = (size) =>
						callback(
							[{ contentRect: size } as ResizeObserverEntry],
							this as unknown as ResizeObserver,
						);
				}

				observe = vi.fn();
				disconnect = vi.fn();
			},
		);

		HTMLDivElement.prototype.getAnimations = getBoxAnimations;
	});

	// Vitest globals are off, so Testing Library can't register this itself.
	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
		// Also drops a transition a failed test didn't use.
		vi.resetAllMocks();
	});

	// jsdom doesn't load images, so the image comes with its natural size, as
	// a loaded one does.
	const createImage = ({ height, width }: Size) => {
		const image = document.createElement("img");
		Object.defineProperties(image, {
			naturalHeight: { value: height },
			naturalWidth: { value: width },
		});

		return image;
	};

	// The box of the image, which the transform moves: the parent of the slot
	// the image is put in.
	const getBox = (image: HTMLImageElement): HTMLElement => {
		const box = image.parentElement?.parentElement;
		if (!box) throw new Error("The image is not in a box");

		return box;
	};

	// In a container, as the wheel is listened to on it.
	const renderViewer = (size = IMAGE) => {
		const containerRef = createRef<HTMLDivElement>();
		const image = createImage(size);

		render(
			<div ref={containerRef}>
				<ImageViewer
					containerRef={containerRef}
					image={image}
					onClose={onClose}
				/>
			</div>,
		);

		return { box: getBox(image), image };
	};

	const resize = (size: Size) => act(() => notifyResize(size));

	const renderReadyViewer = () => {
		const rendered = renderViewer();
		resize(CONTAINER);

		return rendered;
	};

	const getToolNames = () =>
		screen.getAllByRole("button").map((button) => button.textContent);

	const clickButton = async (name: string) => {
		const user = userEvent.setup();
		await user.click(screen.getByRole("button", { name }));
	};

	it("shows the image it is given", () => {
		const { image } = renderViewer();

		expect(document.body.contains(image)).toBe(true);
	});

	describe("before the container size is known", () => {
		it("hides the image and the tools", () => {
			const { box } = renderViewer();

			expect(getToolNames()).toEqual(["x-mark"]);
			expect(box.style.display).toBe("none");
		});
	});

	describe("once the container size is known", () => {
		it("shows the fitted image and the tools", () => {
			const { box } = renderReadyViewer();

			expect(getToolNames()).toEqual([
				"x-mark",
				"rotate-right",
				"rotate-left",
				"flip-horizontal",
				"flip-vertical",
				"50%",
			]);
			expect(box.style.display).toBe("");
			expect(getTransform(box)).toEqual({
				rotation: 0,
				scale: [0.5, 0.5],
				translate: [50, -50],
			});
		});

		it("shows the zoom of the fitted image", () => {
			renderReadyViewer();

			expect(screen.getByText("50%")).toBeDefined();
		});

		it("sizes the box of the image to the natural size", () => {
			const { box } = renderReadyViewer();

			expect(box.style).toMatchObject({ height: "200px", width: "400px" });
		});
	});

	describe("tools", () => {
		it("rotates the image and fits it by its rotated size", async () => {
			const { box } = renderReadyViewer();

			await clickButton("rotate-right");

			// Turned a quarter, the image is 200x400 on screen and fits at 25%.
			expect(getTransform(box)).toEqual({
				rotation: 90,
				scale: [0.25, 0.25],
				translate: [50, -50],
			});
		});

		it("returns a zoomed image to the fitted size before it rotates", async () => {
			const { promise, resolve } = Promise.withResolvers<Animation>();
			getBoxAnimations.mockReturnValueOnce([
				{ finished: promise, transitionProperty: "transform" } as CSSTransition,
			]);
			const { box, image } = renderReadyViewer();

			await userEvent.setup().click(image);
			await clickButton("rotate-right");

			expect(getTransform(box)).toEqual({
				rotation: 0,
				scale: [0.5, 0.5],
				translate: [50, -50],
			});

			await act(async () => resolve({} as Animation));

			expect(getTransform(box)).toEqual({
				rotation: 90,
				scale: [0.25, 0.25],
				translate: [50, -50],
			});
		});

		it("ignores the tools until the turn ends", async () => {
			const { promise, resolve } = Promise.withResolvers<Animation>();
			getBoxAnimations.mockReturnValueOnce([
				{ finished: promise, transitionProperty: "transform" } as CSSTransition,
			]);
			const { box } = renderReadyViewer();

			await clickButton("rotate-right");
			await clickButton("flip-horizontal");

			expect(getTransform(box).scale).toEqual([0.25, 0.25]);

			await act(async () => resolve({} as Animation));
			await clickButton("flip-horizontal");

			expect(getTransform(box).scale).toEqual([-0.25, 0.25]);
		});

		it("ignores the tools until a flip ends", async () => {
			const { promise, resolve } = Promise.withResolvers<Animation>();
			getBoxAnimations.mockReturnValueOnce([
				{ finished: promise, transitionProperty: "transform" } as CSSTransition,
			]);
			const { box } = renderReadyViewer();

			await clickButton("flip-horizontal");
			await clickButton("flip-vertical");
			await clickButton("rotate-right");

			expect(getTransform(box)).toMatchObject({
				rotation: 0,
				scale: [-0.5, 0.5],
			});

			await act(async () => resolve({} as Animation));
			await clickButton("flip-vertical");

			expect(getTransform(box).scale).toEqual([-0.5, -0.5]);
		});

		it("ignores the tools during both the return and the turn", async () => {
			const fit = Promise.withResolvers<Animation>();
			const turn = Promise.withResolvers<Animation>();
			getBoxAnimations
				.mockReturnValueOnce([
					{
						finished: fit.promise,
						transitionProperty: "transform",
					} as CSSTransition,
				])
				.mockReturnValueOnce([
					{
						finished: turn.promise,
						transitionProperty: "transform",
					} as CSSTransition,
				]);
			const { box, image } = renderReadyViewer();

			await userEvent.setup().click(image);
			await clickButton("rotate-right");
			await clickButton("flip-horizontal");

			expect(getTransform(box)).toMatchObject({
				rotation: 0,
				scale: [0.5, 0.5],
			});

			await act(async () => fit.resolve({} as Animation));
			await clickButton("flip-horizontal");

			expect(getTransform(box)).toMatchObject({
				rotation: 90,
				scale: [0.25, 0.25],
			});

			await act(async () => turn.resolve({} as Animation));
			await clickButton("flip-horizontal");

			expect(getTransform(box).scale).toEqual([-0.25, 0.25]);
		});

		it("ignores the tools until a resize during a flip ends", async () => {
			const flip = Promise.withResolvers<Animation>();
			const fit = Promise.withResolvers<Animation>();
			getBoxAnimations
				.mockReturnValueOnce([
					{
						finished: flip.promise,
						transitionProperty: "transform",
					} as CSSTransition,
				])
				.mockReturnValueOnce([
					{
						finished: fit.promise,
						transitionProperty: "transform",
					} as CSSTransition,
				]);
			const { box } = renderReadyViewer();

			await clickButton("flip-horizontal");
			resize({ height: 200, width: 500 });
			// The new transform replaces the transition of the flip.
			await act(async () => flip.reject(new DOMException("", "AbortError")));
			await clickButton("flip-vertical");

			expect(getTransform(box).scale).toEqual([-1, 1]);

			await act(async () => fit.resolve({} as Animation));
			await clickButton("flip-vertical");

			expect(getTransform(box).scale).toEqual([-1, -1]);
		});

		it("ignores the mouse until a flip ends", async () => {
			const { promise, resolve } = Promise.withResolvers<Animation>();
			getBoxAnimations.mockReturnValueOnce([
				{ finished: promise, transitionProperty: "transform" } as CSSTransition,
			]);
			const user = userEvent.setup();
			const { image } = renderReadyViewer();

			await clickButton("flip-horizontal");
			await user.click(image);
			fireEvent.wheel(image, { deltaY: -1000 });

			expect(screen.getByText("50%")).toBeDefined();

			await act(async () => resolve({} as Animation));
			await user.click(image);

			expect(screen.getByText("100%")).toBeDefined();
		});

		it("toggles the zoom on the zoom button around the center", async () => {
			const { box } = renderReadyViewer();

			await clickButton("50%");

			// At 100% the image is 400x200 in the container of 500x100. It stays
			// centered, as it did when fitted.
			expect(getTransform(box)).toEqual({
				rotation: 0,
				scale: [1, 1],
				translate: [50, -50],
			});
			expect(screen.getByText("100%")).toBeDefined();
			expect(onClose).not.toHaveBeenCalled();
		});

		it("rotates the image left", async () => {
			const { box } = renderReadyViewer();

			await clickButton("rotate-left");

			expect(getTransform(box).rotation).toBe(-90);
		});

		it.each([
			["flip-horizontal", [-0.5, 0.5]],
			["flip-vertical", [0.5, -0.5]],
		])("mirrors the image on %s", async (name, scale) => {
			const { box } = renderReadyViewer();

			await clickButton(name);

			expect(getTransform(box).scale).toEqual(scale);
		});
	});

	describe("image", () => {
		it("toggles the zoom on a click without closing the viewer", async () => {
			const user = userEvent.setup();
			const { box, image } = renderReadyViewer();

			await user.click(image);

			expect(getTransform(box).scale).toEqual([1, 1]);
			expect(screen.getByText("100%")).toBeDefined();
			expect(onClose).not.toHaveBeenCalled();
		});

		it("doesn't block anything while its transitions run", async () => {
			// Never ends, so a blocking action would keep the next ones waiting.
			getBoxAnimations.mockReturnValue([
				{
					finished: new Promise(() => {}),
					transitionProperty: "transform",
				} as CSSTransition,
			]);
			const user = userEvent.setup();
			const { box, image } = renderReadyViewer();

			await user.click(image);
			await user.click(image);

			expect(screen.getByText("50%")).toBeDefined();

			await user.click(image);
			fireEvent.wheel(image, { deltaY: 100 });

			// 100% / e^(100 * 0.001).
			expect(screen.getByText("90%")).toBeDefined();

			await clickButton("flip-horizontal");

			expect(getTransform(box).scale[0]).toBeLessThan(0);
		});

		it("can't be dragged natively", () => {
			const { image } = renderViewer();

			expect(image.draggable).toBe(false);
		});
	});

	describe("closing", () => {
		it("asks to close on the close button", async () => {
			renderReadyViewer();

			await clickButton("x-mark");

			expect(onClose).toHaveBeenCalledOnce();
		});

		it("asks to close before the container size is known", async () => {
			renderViewer();

			await clickButton("x-mark");

			expect(onClose).toHaveBeenCalledOnce();
		});
	});
});
