import { afterEach, describe, expect, it, vi } from "vitest";
import { t } from "./t";

describe("t", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns the message", () => {
		expect(t("viewer@load_error")).toBe("Couldn't open the image or video");
	});

	it("returns the message name if the message is missing", () => {
		vi.spyOn(browser.i18n, "getMessage").mockReturnValue("");

		expect(t("viewer@load_error")).toBe("viewer@load_error");
	});

	it("passes the arguments to browser.i18n.getMessage", () => {
		const getMessage = vi.spyOn(browser.i18n, "getMessage");

		t("viewer@load_error", ["photo.png"], { escapeLt: true });

		expect(getMessage).toHaveBeenCalledWith(
			"viewer@load_error",
			["photo.png"],
			{
				escapeLt: true,
			},
		);
	});
});
