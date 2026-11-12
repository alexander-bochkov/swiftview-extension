import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ImageTools } from "./image-tools";

// The buttons contain only an icon, so render its name to make them queryable.
vi.mock("../../components/icon", async (importOriginal) => ({
	...(await importOriginal<typeof import("../../components/icon")>()),
	Icon: ({ name }: { name: string }) => name,
}));

describe("ImageTools", () => {
	const onFlip = vi.fn();
	const onRotate = vi.fn();
	const onToggleZoom = vi.fn();

	// Vitest globals are off, so Testing Library can't register this itself.
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	const renderTools = (scale = 1) =>
		render(
			<ImageTools
				onFlip={onFlip}
				onRotate={onRotate}
				onToggleZoom={onToggleZoom}
				scale={scale}
			/>,
		);

	const clickButton = async (name: string) => {
		const user = userEvent.setup();
		renderTools();

		await user.click(screen.getByRole("button", { name }));
	};

	it("shows the tools in order", () => {
		renderTools();

		expect(
			screen.getAllByRole("button").map((button) => button.textContent),
		).toEqual([
			"rotate-right",
			"rotate-left",
			"flip-horizontal",
			"flip-vertical",
			"100%",
		]);
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
			renderTools(scale);

			expect(screen.getByText(text)).toBeDefined();
		});

		it("toggles the zoom on the zoom button", async () => {
			await clickButton("100%");

			expect(onToggleZoom).toHaveBeenCalledOnce();
		});
	});
});
