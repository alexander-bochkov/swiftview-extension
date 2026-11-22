import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
// Adds the APIs the fake browser lacks. WxtVitest sets it as `browser`.
import "./src/shared/test-utils";

// Vitest globals are off, so Testing Library can't register this itself.
afterEach(cleanup);
