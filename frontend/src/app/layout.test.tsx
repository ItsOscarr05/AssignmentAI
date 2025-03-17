import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import RootLayout from "./layout";

// Mock the providers component
vi.mock("./providers", () => ({
  Providers: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="providers">{children}</div>
  ),
}));

// Mock Vercel components
vi.mock("@vercel/analytics", () => ({
  Analytics: () => null,
}));

vi.mock("@vercel/speed-insights", () => ({
  SpeedInsights: () => null,
}));

describe("RootLayout", () => {
  it("renders children within providers", () => {
    render(
      <RootLayout
        params={{
          lang: "",
        }}
      >
        <div>Test Content</div>
      </RootLayout>
    );

    expect(screen.getByTestId("providers")).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("sets correct HTML attributes", () => {
    render(
      <RootLayout
        params={{
          lang: "",
        }}
      >
        <div>Test Content</div>
      </RootLayout>
    );

    const html = document.documentElement;
    expect(html).toHaveAttribute("lang", "en");
  });
});
