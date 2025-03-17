import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Providers } from "./providers";

// Mock the theme provider
vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  MotionConfig: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="motion-config">{children}</div>
  ),
}));

// Mock the toast provider
vi.mock("../components/Toast/Toast", () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="toast-provider">{children}</div>
  ),
}));

// Mock the auth provider
vi.mock("../lib/auth", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
}));

describe("Providers", () => {
  it("renders children within all providers", () => {
    render(
      <Providers>
        <div>Test Content</div>
      </Providers>
    );

    expect(screen.getByTestId("theme-provider")).toBeInTheDocument();
    expect(screen.getByTestId("motion-config")).toBeInTheDocument();
    expect(screen.getByTestId("toast-provider")).toBeInTheDocument();
    expect(screen.getByTestId("auth-provider")).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("initializes with QueryClient", () => {
    render(
      <Providers>
        <div>Query Test</div>
      </Providers>
    );

    expect(screen.getByText("Query Test")).toBeInTheDocument();
  });
});
