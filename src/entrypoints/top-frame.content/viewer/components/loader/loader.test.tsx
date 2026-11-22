import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Loader } from "./loader";

// Render the icon's name to make it queryable.
vi.mock("../icon", async (importOriginal) => ({
	...(await importOriginal<typeof import("../icon")>()),
	Icon: ({ name }: { name: string }) => name,
}));

describe("Loader", () => {
	it("shows the spinner icon", () => {
		render(<Loader />);

		expect(screen.getByText("spinner")).toBeDefined();
	});
});
