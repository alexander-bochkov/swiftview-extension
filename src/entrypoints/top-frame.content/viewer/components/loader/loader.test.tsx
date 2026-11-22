import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Loader } from "./loader";

// Render the icon's name to make it queryable.
vi.mock("../icon", async (importOriginal) => ({
	...(await importOriginal<typeof import("../icon")>()),
	Icon: ({ name }: { name: string }) => name,
}));

describe("Loader", () => {
	// Vitest globals are off, so Testing Library can't register this itself.
	afterEach(cleanup);

	it("shows the spinner icon", () => {
		render(<Loader />);

		expect(screen.getByText("spinner")).toBeDefined();
	});
});
