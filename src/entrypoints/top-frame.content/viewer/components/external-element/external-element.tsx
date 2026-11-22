import {
	type ComponentProps,
	useImperativeHandle,
	useLayoutEffect,
	useRef,
} from "react";

type ExternalElementProps = Omit<ComponentProps<"div">, "children"> & {
	element: Element;
};

// Shows an element that exists already, such as the media the probe loaded,
// which JSX can't render. Before the paint, so the element never misses a
// frame.
export const ExternalElement = ({
	element,
	ref,
	...props
}: ExternalElementProps) => {
	const wrapperRef = useRef<HTMLDivElement>(null);

	// The ref of the caller gets the wrapper too, e.g. to focus it.
	useImperativeHandle(ref, () => wrapperRef.current as HTMLDivElement, []);

	useLayoutEffect(() => {
		wrapperRef.current?.replaceChildren(element);

		return () => element.remove();
	}, [element]);

	return <div {...props} ref={wrapperRef} />;
};
