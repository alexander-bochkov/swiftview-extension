import type { Nullable } from "@/shared/types";

// Runs create() once and gives every call its result, also the calls made
// while it's still running. If it fails, the next call runs it again.
export const cachePromise = <T>(
	create: () => Promise<T>,
): (() => Promise<T>) => {
	let promise: Nullable<Promise<T>> = null;

	return async () => {
		promise ??= create();

		// Awaited inside the try, so a failure reaches the catch.
		try {
			return await promise;
		} catch (error) {
			promise = null;
			throw error;
		}
	};
};
