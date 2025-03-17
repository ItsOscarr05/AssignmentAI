import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";

function SimpleComponent() {
  return <div>Hello World</div>;
}

test("renders hello world", () => {
  render(<SimpleComponent />);
  expect(screen.getByText("Hello World")).toBeInTheDocument();
});
