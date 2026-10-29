import { afterEach, describe, expect, it, vi } from "vitest";
import { t } from "./i18n";

describe("t", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns the message", () => {
		expect(t("imageError")).toBe("Couldn't open the image");
	});

	it("passes the arguments to chrome.i18n.getMessage", () => {
		const getMessage = vi.spyOn(chrome.i18n, "getMessage");

		t("imageError", ["photo.png"], { escapeLt: true });

		expect(getMessage).toHaveBeenCalledWith("imageError", ["photo.png"], {
			escapeLt: true,
		});
	});
});
