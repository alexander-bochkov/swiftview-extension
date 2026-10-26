import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Toolbar } from "./toolbar";

// The buttons contain only an icon, so render its name to make them queryable.
vi.mock("../../../components", async (importOriginal) => ({
	...(await importOriginal<typeof import("../../../components")>()),
	Icon: ({ name }: { name: string }) => name,
}));

describe("Toolbar", () => {
	const onClose = vi.fn();
	const onFlip = vi.fn();
	const onRotate = vi.fn();

	// Vitest globals are off, so Testing Library can't register this itself.
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	const renderToolbar = (hideTools = false, scale = 1) =>
		render(
			<Toolbar
				hideTools={hideTools}
				onClose={onClose}
				onFlip={onFlip}
				onRotate={onRotate}
				scale={scale}
			/>,
		);

	const clickButton = async (name: string) => {
		const user = userEvent.setup();
		renderToolbar();

		await user.click(screen.getByRole("button", { name }));
	};

	it("closes on the close button", async () => {
		await clickButton("x-mark");

		expect(onClose).toHaveBeenCalledOnce();
	});

	it.each([
		["rotate-right", "right"],
		["rotate-left", "left"],
	])("rotates on the %s button", async (name, direction) => {
		await clickButton(name);

		expect(onRotate).toHaveBeenCalledExactlyOnceWith(direction);
	});

	it.each([
		["flip-horizontal", "horizontal"],
		["flip-vertical", "vertical"],
	])("flips on the %s button", async (name, direction) => {
		await clickButton(name);

		expect(onFlip).toHaveBeenCalledExactlyOnceWith(direction);
	});

	describe("zoom", () => {
		it.each([
			["in whole percents", 0.333, "33%"],
			["above 100%", 4, "400%"],
			["as at least 1% for a very large image", 0.004, "1%"],
		])("shows the zoom %s", (_, scale, text) => {
			renderToolbar(false, scale);

			expect(screen.getByText(text)).toBeDefined();
		});
	});

	describe("hidden tools", () => {
		it("shows only the close button", () => {
			renderToolbar(true);

			expect(
				screen.getAllByRole("button").map((button) => button.textContent),
			).toEqual(["x-mark"]);
		});

		it("hides the zoom", () => {
			renderToolbar(true);

			expect(screen.queryByText("100%")).toBeNull();
		});

		it("still closes on the close button", async () => {
			const user = userEvent.setup();
			renderToolbar(true);

			await user.click(screen.getByRole("button", { name: "x-mark" }));

			expect(onClose).toHaveBeenCalledOnce();
		});
	});
});
