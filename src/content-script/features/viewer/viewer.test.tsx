import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Viewer } from "./viewer";

// The buttons contain only an icon, so render its name to make them queryable.
vi.mock("../../components", async (importOriginal) => ({
	...(await importOriginal<typeof import("../../components")>()),
	Icon: ({ name }: { name: string }) => name,
}));

type Size = { height: number; width: number };

const IMAGE_URL = "https://example.com/image.png";

// An image of 400x200 in a container of 500x100 fits at 50%. The layout box
// sits at 0, 0 in the natural size, so the fitted image is moved by 50, -50.
const CONTAINER: Size = { height: 100, width: 500 };
const IMAGE: Size = { height: 200, width: 400 };

describe("Viewer", () => {
	const onClose = vi.fn();
	let notifyResize: (size: Size) => void;

	// jsdom doesn't implement the modal dialog and animations either. No
	// transitions by default.
	const close = vi.fn(function (this: HTMLDialogElement) {
		this.open = false;
	});
	const getAnimations = vi.fn((): Animation[] => []);

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

		HTMLDialogElement.prototype.showModal = function () {
			this.open = true;
		};
		HTMLDialogElement.prototype.close = close;
		HTMLDialogElement.prototype.getAnimations = getAnimations;
	});

	// Vitest globals are off, so Testing Library can't register this itself.
	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
		// Also drops a transition a failed test didn't use.
		vi.resetAllMocks();
	});

	const renderViewer = () => {
		const { container } = render(<Viewer onClose={onClose} url={IMAGE_URL} />);

		// The image has an empty `alt`, so it has no role to query by.
		const image = container.querySelector("img") as HTMLImageElement;

		return { image };
	};

	const resize = (size: Size) => act(() => notifyResize(size));

	// jsdom doesn't load images, so report the natural size and the load.
	const load = (image: HTMLImageElement, { height, width }: Size) => {
		Object.defineProperties(image, {
			naturalHeight: { value: height },
			naturalWidth: { value: width },
		});
		fireEvent.load(image);
	};

	const renderReadyViewer = () => {
		const rendered = renderViewer();

		resize(CONTAINER);
		load(rendered.image, IMAGE);

		return rendered;
	};

	const getToolNames = () =>
		screen.getAllByRole("button").map((button) => button.textContent);

	const clickButton = async (name: string) => {
		const user = userEvent.setup();
		await user.click(screen.getByRole("button", { name }));
	};

	it("shows the image from the url", () => {
		const { image } = renderViewer();

		expect(image.getAttribute("src")).toBe(IMAGE_URL);
	});

	describe("before the sizes are known", () => {
		it.each<[string, (image: HTMLImageElement) => void]>([
			["neither size", () => {}],
			["the container size only", () => resize(CONTAINER)],
			["the image size only", (image) => load(image, IMAGE)],
		])("shows the loader with %s", (_, report) => {
			const { image } = renderViewer();

			report(image);

			expect(screen.getByText("spinner")).toBeDefined();
			expect(getToolNames()).toEqual(["x-mark"]);
			expect(image.style.display).toBe("none");
		});
	});

	describe("once both sizes are known", () => {
		it("shows the fitted image and the tools instead of the loader", () => {
			const { image } = renderReadyViewer();

			expect(screen.queryByText("spinner")).toBeNull();
			expect(getToolNames()).toEqual([
				"x-mark",
				"rotate-right",
				"rotate-left",
				"flip-horizontal",
				"flip-vertical",
			]);
			expect(image.style.display).toBe("");
			expect(image.style.transform).toBe(
				"translate(50px, -50px) scale(0.5, 0.5) rotate(0deg)",
			);
		});

		it("shows the zoom of the fitted image", () => {
			renderReadyViewer();

			expect(screen.getByText("50%")).toBeDefined();
		});

		it("shows the image in the natural size for its layout box", () => {
			const { image } = renderReadyViewer();

			expect(image.style).toMatchObject({ height: "200px", width: "400px" });
		});
	});

	describe("tools", () => {
		it("rotates the image and fits it by its rotated size", async () => {
			const { image } = renderReadyViewer();

			await clickButton("rotate-right");

			// Turned a quarter, the image is 200x400 on screen and fits at 25%.
			expect(image.style.transform).toBe(
				"translate(50px, -50px) scale(0.25, 0.25) rotate(90deg)",
			);
		});

		it("rotates the image left", async () => {
			const { image } = renderReadyViewer();

			await clickButton("rotate-left");

			expect(image.style.transform).toContain("rotate(-90deg)");
		});

		it.each([
			["flip-horizontal", "scale(-0.5, 0.5)"],
			["flip-vertical", "scale(0.5, -0.5)"],
		])("mirrors the image on %s", async (name, scale) => {
			const { image } = renderReadyViewer();

			await clickButton(name);

			expect(image.style.transform).toContain(scale);
		});
	});

	describe("image", () => {
		it("toggles the zoom on a click without closing the viewer", async () => {
			const user = userEvent.setup();
			const { image } = renderReadyViewer();

			await user.click(image);

			expect(image.style.transform).toContain("scale(1, 1)");
			expect(screen.getByText("100%")).toBeDefined();
			expect(onClose).not.toHaveBeenCalled();
		});
	});

	describe("an image that can't be shown", () => {
		const MESSAGE = "Couldn't open the image";

		it.each<[string, (image: HTMLImageElement) => void]>([
			["fails to load", (image) => fireEvent.error(image)],
			["has no size", (image) => load(image, { height: 0, width: 0 })],
		])("shows the error instead of the loader when it %s", (_, report) => {
			const { image } = renderViewer();

			resize(CONTAINER);
			report(image);

			expect(screen.getByText(MESSAGE)).toBeDefined();
			expect(screen.queryByText("spinner")).toBeNull();
			expect(getToolNames()).toEqual(["x-mark"]);
			expect(image.style.display).toBe("none");
		});

		it("doesn't show the error while the image loads", () => {
			renderViewer();

			expect(screen.queryByText(MESSAGE)).toBeNull();
		});

		it("stays open until it's closed", async () => {
			const { image } = renderViewer();

			fireEvent.error(image);

			expect(onClose).not.toHaveBeenCalled();

			await clickButton("x-mark");

			await vi.waitFor(() => expect(onClose).toHaveBeenCalledOnce());
		});
	});

	describe("closing", () => {
		it("closes on the close button once the fade ends", async () => {
			const { promise, resolve } = Promise.withResolvers<Animation>();
			getAnimations.mockReturnValueOnce([{ finished: promise } as Animation]);
			renderReadyViewer();

			await clickButton("x-mark");

			expect(close).toHaveBeenCalledOnce();
			expect(onClose).not.toHaveBeenCalled();

			await act(async () => resolve({} as Animation));

			expect(onClose).toHaveBeenCalledOnce();
		});

		it("closes on the close button before the sizes are known", async () => {
			renderViewer();

			await clickButton("x-mark");

			await vi.waitFor(() => expect(onClose).toHaveBeenCalledOnce());
		});

		it("closes on Escape", async () => {
			const user = userEvent.setup();
			renderReadyViewer();

			screen.getByRole("button", { name: "x-mark" }).focus();
			await user.keyboard("{Escape}");

			await vi.waitFor(() => expect(onClose).toHaveBeenCalledOnce());
		});
	});
});
