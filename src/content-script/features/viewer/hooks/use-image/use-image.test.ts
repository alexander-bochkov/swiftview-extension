import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Viewer, ViewerState } from "../../types";
import { useImage } from "./use-image";

describe("useImage", () => {
	const renderImage = (state: ViewerState) => {
		const viewer: Viewer = { dispatch: vi.fn(), state };

		return renderHook(() => useImage({ viewer })).result.current;
	};

	it("does not transform the image in the initial state", () => {
		const { style } = renderImage({ flipX: 1, flipY: 1, rotation: 0 });

		expect(style?.transform).toBe("scale(1, 1) rotate(0deg)");
	});

	it("applies the flip and rotation of the viewer state", () => {
		const { style } = renderImage({ flipX: -1, flipY: 1, rotation: 270 });

		expect(style?.transform).toBe("scale(-1, 1) rotate(270deg)");
	});
});
