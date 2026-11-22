import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoadError } from "./load-error";

// Render the icon's name to make it queryable.
vi.mock("../icon", async (importOriginal) => ({
	...(await importOriginal<typeof import("../icon")>()),
	Icon: ({ name }: { name: string }) => name,
}));

describe("LoadError", () => {
	// Vitest globals are off, so Testing Library can't register this itself.
	afterEach(cleanup);

	it("shows the no-symbol icon", () => {
		render(<LoadError />);

		expect(screen.getByText("no-symbol")).toBeDefined();
	});

	it("tells that the media couldn't be opened", () => {
		render(<LoadError />);

		expect(screen.getByText("Couldn't open the image or video")).toBeDefined();
	});
});
