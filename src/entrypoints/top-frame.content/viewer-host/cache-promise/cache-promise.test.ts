import { describe, expect, it, vi } from "vitest";
import { cachePromise } from "./cache-promise";

describe("cachePromise", () => {
	it("creates on the first call", async () => {
		const create = vi.fn(() => Promise.resolve("ui"));
		const get = cachePromise(create);

		await expect(get()).resolves.toBe("ui");
		expect(create).toHaveBeenCalledOnce();
	});

	it("doesn't create before the first call", () => {
		const create = vi.fn(() => Promise.resolve("ui"));

		cachePromise(create);

		expect(create).not.toHaveBeenCalled();
	});

	it("gives the same value to the later calls", async () => {
		const create = vi.fn(() => Promise.resolve({}));
		const get = cachePromise(create);

		const first = await get();
		const second = await get();

		expect(second).toBe(first);
		expect(create).toHaveBeenCalledOnce();
	});

	it("shares a pending creation", async () => {
		let resolve = (_: string) => {};
		const create = vi.fn(
			() =>
				new Promise<string>((done) => {
					resolve = done;
				}),
		);
		const get = cachePromise(create);

		const first = get();
		const second = get();
		resolve("ui");

		await expect(Promise.all([first, second])).resolves.toEqual(["ui", "ui"]);
		expect(create).toHaveBeenCalledOnce();
	});

	describe("after a failure", () => {
		const error = new Error("creation failed");

		it("rejects with the error", async () => {
			const get = cachePromise(() => Promise.reject(error));

			await expect(get()).rejects.toBe(error);
		});

		it("rejects every call that shared the creation", async () => {
			const get = cachePromise(() => Promise.reject(error));

			const results = await Promise.allSettled([get(), get()]);

			expect(results).toEqual([
				{ reason: error, status: "rejected" },
				{ reason: error, status: "rejected" },
			]);
		});

		it("creates again on the next call", async () => {
			const create = vi
				.fn<() => Promise<string>>()
				.mockRejectedValueOnce(error)
				.mockResolvedValueOnce("ui");
			const get = cachePromise(create);

			await expect(get()).rejects.toBe(error);
			await expect(get()).resolves.toBe("ui");
			expect(create).toHaveBeenCalledTimes(2);
		});
	});
});
