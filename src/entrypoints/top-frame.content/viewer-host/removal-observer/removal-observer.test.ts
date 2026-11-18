import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RemovalObserver } from "./removal-observer";

describe("RemovalObserver", () => {
	const onRemove = vi.fn();

	let container: HTMLElement;
	let element: HTMLElement;
	let removalObserver: RemovalObserver;

	// Mutation observers call back in a microtask, which has run by the next
	// task.
	const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

	beforeEach(() => {
		container = document.createElement("div");
		element = document.createElement("div");
		container.append(element);
		document.body.append(container);

		removalObserver = new RemovalObserver();
	});

	afterEach(() => {
		removalObserver.disconnect();
		container.remove();
		vi.resetAllMocks();
	});

	it("calls back once the element is removed", async () => {
		removalObserver.observe(element, onRemove);

		element.remove();
		await flush();

		expect(onRemove).toHaveBeenCalledOnce();
	});

	it("calls back once an ancestor of the element is removed", async () => {
		removalObserver.observe(element, onRemove);

		container.remove();
		await flush();

		expect(onRemove).toHaveBeenCalledOnce();
	});

	it("doesn't call back for other changes around the element", async () => {
		removalObserver.observe(element, onRemove);

		const sibling = document.createElement("div");
		container.append(sibling);
		sibling.remove();
		document.body.append(sibling);
		await flush();

		expect(onRemove).not.toHaveBeenCalled();
	});

	it("doesn't call back for an element moved within the document", async () => {
		removalObserver.observe(element, onRemove);

		document.body.append(element);
		await flush();

		expect(onRemove).not.toHaveBeenCalled();
	});

	it("calls back only once", async () => {
		removalObserver.observe(element, onRemove);

		element.remove();
		await flush();
		container.append(element);
		element.remove();
		await flush();

		expect(onRemove).toHaveBeenCalledOnce();
	});

	it("doesn't call back after disconnect", async () => {
		removalObserver.observe(element, onRemove);

		removalObserver.disconnect();
		element.remove();
		await flush();

		expect(onRemove).not.toHaveBeenCalled();
	});

	it("keeps the first element while observing", async () => {
		const other = document.createElement("div");
		container.append(other);

		removalObserver.observe(element, onRemove);
		removalObserver.observe(other, vi.fn());
		element.remove();
		await flush();

		expect(onRemove).toHaveBeenCalledOnce();
	});

	it("can observe again after disconnect", async () => {
		removalObserver.observe(element, vi.fn());
		removalObserver.disconnect();

		removalObserver.observe(element, onRemove);
		element.remove();
		await flush();

		expect(onRemove).toHaveBeenCalledOnce();
	});
});
