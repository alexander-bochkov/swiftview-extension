import { afterEach, describe, expect, it, vi } from "vitest";
import { t } from "./t";

describe("t", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns the message", () => {
		expect(t("viewer@image_error")).toBe("Couldn't open the image");
	});

	it("returns the message name if the message is missing", () => {
		vi.spyOn(browser.i18n, "getMessage").mockReturnValue("");

		expect(t("viewer@image_error")).toBe("viewer@image_error");
	});

	it("passes the arguments to browser.i18n.getMessage", () => {
		const getMessage = vi.spyOn(browser.i18n, "getMessage");

		t("viewer@image_error", ["photo.png"], { escapeLt: true });

		expect(getMessage).toHaveBeenCalledWith(
			"viewer@image_error",
			["photo.png"],
			{
				escapeLt: true,
			},
		);
	});
});
