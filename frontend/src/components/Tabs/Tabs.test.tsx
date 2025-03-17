import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Tabs } from "./Tabs";

describe("Tabs", () => {
  const defaultProps = {
    defaultValue: "tab1",
    items: [
      { value: "tab1", label: "Tab 1", content: "Content 1" },
      { value: "tab2", label: "Tab 2", content: "Content 2" },
      { value: "tab3", label: "Tab 3", content: "Content 3" },
    ],
  };

  it("renders all tab triggers", () => {
    render(<Tabs tabs={[]} {...defaultProps} />);

    defaultProps.items.forEach((item) => {
      expect(screen.getByRole("tab", { name: item.label })).toBeInTheDocument();
    });
  });

  it("shows the content of the selected tab", () => {
    render(<Tabs tabs={[]} {...defaultProps} />);

    expect(screen.getByText("Content 1")).toBeInTheDocument();
    expect(screen.queryByText("Content 2")).not.toBeInTheDocument();
  });
  it("switches content when clicking different tabs", () => {
    render(<Tabs tabs={[]} {...defaultProps} />);

    // Click second tab
    fireEvent.click(screen.getByRole("tab", { name: "Tab 2" }));
    expect(screen.getByText("Content 2")).toBeInTheDocument();
    expect(screen.queryByText("Content 1")).not.toBeInTheDocument();

    // Click third tab
    fireEvent.click(screen.getByRole("tab", { name: "Tab 3" }));
    expect(screen.getByText("Content 3")).toBeInTheDocument();
    expect(screen.queryByText("Content 2")).not.toBeInTheDocument();
  });
  it("maintains selected state on the active tab", () => {
    render(<Tabs tabs={[]} {...defaultProps} />);

    const firstTab = screen.getByRole("tab", { name: "Tab 1" });
    const secondTab = screen.getByRole("tab", { name: "Tab 2" });

    expect(firstTab).toHaveAttribute("aria-selected", "true");
    expect(secondTab).toHaveAttribute("aria-selected", "false");

    fireEvent.click(secondTab);

    expect(firstTab).toHaveAttribute("aria-selected", "false");
    expect(secondTab).toHaveAttribute("aria-selected", "true");
  });
});
