import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ImageError } from "./image-error";

// Render the icon's name to make it queryable.
vi.mock("../../../components", async (importOriginal) => ({
	...(await importOriginal<typeof import("../../../components")>()),
	Icon: ({ name }: { name: string }) => name,
}));

describe("ImageError", () => {
	// Vitest globals are off, so Testing Library can't register this itself.
	afterEach(cleanup);

	it("shows the no-symbol icon", () => {
		render(<ImageError />);

		expect(screen.getByText("no-symbol")).toBeDefined();
	});

	it("tells that the image couldn't be opened", () => {
		render(<ImageError />);

		expect(screen.getByText("Couldn't open the image")).toBeDefined();
	});
});
