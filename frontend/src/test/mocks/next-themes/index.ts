import React from "react";
import { vi } from "vitest";

export const ThemeProvider = ({ children }: { children: React.ReactNode }) =>
  React.createElement("div", null, children);

export const useTheme = () => ({
  theme: "light",
  setTheme: vi.fn(),
});
