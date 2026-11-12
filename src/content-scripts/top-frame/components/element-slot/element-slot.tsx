import { type ComponentProps, useLayoutEffect, useRef } from "react";

type ElementSlotProps = Omit<ComponentProps<"div">, "children"> & {
	element: Element;
};

// Shows an element that exists already, such as the media the probe loaded,
// which JSX can't render. Before the paint, so the element never misses a
// frame.
export const ElementSlot = ({ element, ...props }: ElementSlotProps) => {
	const slotRef = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		slotRef.current?.replaceChildren(element);

		return () => element.remove();
	}, [element]);

	return <div {...props} ref={slotRef} />;
};
