import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

const TestComponent = () => <div>Test</div>;

describe("basic", () => {
  it("should pass", () => {
    expect(true).toBe(true);
  });

  it("should render component", () => {
    render(<TestComponent />);
    expect(screen.getByText("Test")).toBeInTheDocument();
  });
});
