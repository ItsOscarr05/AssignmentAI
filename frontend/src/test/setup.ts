import "@testing-library/jest-dom";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import React from "react";

// Mock React Router DOM
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  Link: (props: any) => React.createElement("a", props, props.children),
}));

// Mock Auth Context
const mockLogin = vi.fn().mockResolvedValue({});
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    login: mockLogin,
    user: null,
    loading: false,
    error: null,
  }),
}));

// Mock Material-UI
vi.mock("@mui/material", () => ({
  Container: (props: any) => React.createElement("div", props, props.children),
  Paper: (props: any) => React.createElement("div", props, props.children),
  TextField: (props: any) =>
    React.createElement("input", { "aria-label": props.label, ...props }),
  Button: (props: any) => React.createElement("button", props, props.children),
  Typography: (props: any) =>
    React.createElement(props.component || "div", props, props.children),
  Box: (props: any) => React.createElement("div", props, props.children),
  Alert: (props: any) =>
    React.createElement("div", { role: "alert", ...props }, props.children),
}));

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserverMock;

// Mock IntersectionObserver
class IntersectionObserverMock {
  root = null;
  rootMargin = "0px";
  thresholds = [0];
  private callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    // Store callback but don't use it in this mock
    this.callback = callback;
  }

  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

window.IntersectionObserver = IntersectionObserverMock;

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock fetch
global.fetch = vi.fn();

// Export mocks for test files to use
export const mocks = {
  mockNavigate,
  mockLogin,
};

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
