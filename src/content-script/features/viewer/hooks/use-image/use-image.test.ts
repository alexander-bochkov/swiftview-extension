import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Viewer } from "../use-viewer";
import { useImage } from "./use-image";

describe("useImage", () => {
	const renderImage = (state: Viewer["state"]) => {
		const viewer: Viewer = { dispatch: vi.fn(), state };

		return renderHook(() => useImage({ viewer })).result.current;
	};

	it("does not transform the image in the initial state", () => {
		const { style } = renderImage({ rotation: 0, scaleX: 1, scaleY: 1 });

		expect(style?.transform).toBe("scale(1, 1) rotate(0deg)");
	});

	it("applies the flip and rotation of the viewer state", () => {
		const { style } = renderImage({ rotation: 270, scaleX: -1, scaleY: 1 });

		expect(style?.transform).toBe("scale(-1, 1) rotate(270deg)");
	});
});
