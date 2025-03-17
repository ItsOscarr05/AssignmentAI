import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Page from "./page";

// Mock the providers
vi.mock("./providers", () => ({
  Providers: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="providers">{children}</div>
  ),
}));

// Mock the router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("Page", () => {
  it("renders main content", () => {
    render(<Page />);

    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("renders navigation", () => {
    render(<Page />);

    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("renders with providers", () => {
    render(<Page />);

    expect(screen.getByTestId("providers")).toBeInTheDocument();
  });
});
