import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type MockInstance,
	vi,
} from "vitest";
import { ViewerFont } from "./viewer-font";

describe("ViewerFont", () => {
	let consoleError: MockInstance<typeof console.error>;
	// jsdom doesn't implement fonts, so the fonts of the document are a plain
	// set of the created faces.
	let fonts: Set<FontFace>;
	let viewerFont: ViewerFont;

	beforeEach(() => {
		consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

		fonts = new Set();
		vi.stubGlobal(
			"FontFace",
			class {
				descriptors: FontFaceDescriptors;
				family: string;
				source: string;

				constructor(
					family: string,
					source: string,
					descriptors: FontFaceDescriptors,
				) {
					this.descriptors = descriptors;
					this.family = family;
					this.source = source;
				}
			},
		);
		Object.defineProperty(document, "fonts", {
			configurable: true,
			value: fonts,
		});

		viewerFont = new ViewerFont();
	});

	afterEach(() => {
		Reflect.deleteProperty(document, "fonts");
		consoleError.mockRestore();
	});

	it("gives the font with sans-serif as the fallback", () => {
		expect(ViewerFont.fontFamily).toBe('"SwiftView Inter", sans-serif');
	});

	describe("add", () => {
		it("adds Inter from the files of the extension to the document", () => {
			viewerFont.add();

			expect([...fonts]).toEqual([
				{
					descriptors: { weight: "100 900" },
					family: "SwiftView Inter",
					source: `url(${fakeBrowser.runtime.getURL("/fonts/inter-variable.woff2")}) format("woff2")`,
				},
			]);
		});

		// Once loaded, it shows at once on the next open.
		it("adds the same font every time", () => {
			viewerFont.add();
			const [first] = fonts;
			viewerFont.remove();
			viewerFont.add();

			expect(fonts.size).toBe(1);
			expect([...fonts][0]).toBe(first);
		});

		it("logs when the font can't be created", () => {
			const error = new SyntaxError("Invalid descriptor");
			vi.stubGlobal(
				"FontFace",
				class {
					constructor() {
						throw error;
					}
				},
			);

			expect(() => viewerFont.add()).not.toThrow();
			expect(consoleError).toHaveBeenCalledExactlyOnceWith(error);
			expect(fonts.size).toBe(0);
		});

		it("logs when the font can't be added", () => {
			const error = new Error("font failed");
			vi.spyOn(fonts, "add").mockImplementationOnce(() => {
				throw error;
			});

			expect(() => viewerFont.add()).not.toThrow();
			expect(consoleError).toHaveBeenCalledExactlyOnceWith(error);
		});

		it("adds the font on the next try after a failure", () => {
			vi.spyOn(fonts, "add").mockImplementationOnce(() => {
				throw new Error("font failed");
			});

			viewerFont.add();
			viewerFont.add();

			expect(fonts.size).toBe(1);
		});
	});

	describe("remove", () => {
		it("removes the font from the document", () => {
			viewerFont.add();
			viewerFont.remove();

			expect(fonts.size).toBe(0);
		});

		it("does nothing before the font is added", () => {
			const remove = vi.spyOn(fonts, "delete");

			viewerFont.remove();

			expect(remove).not.toHaveBeenCalled();
		});
	});
});
