import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dashboard } from "@/app/(dashboard)/page";

// Mock the auth context
vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    user: {
      name: "Test User",
      email: "test@example.com",
    },
    isLoading: false,
  }),
}));

// Mock the API calls
vi.mock("@/lib/api", () => ({
  useAssignments: () => ({
    data: [
      {
        id: 1,
        title: "Assignment 1",
        dueDate: "2024-03-20",
        status: "pending",
      },
      {
        id: 2,
        title: "Assignment 2",
        dueDate: "2024-03-25",
        status: "completed",
      },
    ],
    isLoading: false,
  }),
  useStats: () => ({
    data: {
      completed: 5,
      pending: 3,
      total: 8,
    },
    isLoading: false,
  }),
}));

describe("Dashboard", () => {
  it("renders user information", () => {
    render(<Dashboard />);

    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("displays assignment statistics", () => {
    render(<Dashboard />);

    expect(screen.getByText("5")).toBeInTheDocument(); // Completed
    expect(screen.getByText("3")).toBeInTheDocument(); // Pending
    expect(screen.getByText("8")).toBeInTheDocument(); // Total
  });

  it("renders assignment list", () => {
    render(<Dashboard />);

    expect(screen.getByText("Assignment 1")).toBeInTheDocument();
    expect(screen.getByText("Assignment 2")).toBeInTheDocument();
    expect(screen.getByText("Mar 20, 2024")).toBeInTheDocument();
    expect(screen.getByText("Mar 25, 2024")).toBeInTheDocument();
  });

  it("filters assignments by status", async () => {
    const user = userEvent.setup();
    render(<Dashboard />);

    const pendingFilter = screen.getByRole("button", { name: /pending/i });
    await user.click(pendingFilter);

    await waitFor(() => {
      expect(screen.getByText("Assignment 1")).toBeInTheDocument();
      expect(screen.queryByText("Assignment 2")).not.toBeInTheDocument();
    });

    const completedFilter = screen.getByRole("button", { name: /completed/i });
    await user.click(completedFilter);

    await waitFor(() => {
      expect(screen.queryByText("Assignment 1")).not.toBeInTheDocument();
      expect(screen.getByText("Assignment 2")).toBeInTheDocument();
    });
  });

  it("shows loading state", () => {
    vi.mock("@/lib/api", () => ({
      useAssignments: () => ({
        data: null,
        isLoading: true,
      }),
      useStats: () => ({
        data: null,
        isLoading: true,
      }),
    }));

    render(<Dashboard />);

    expect(screen.getAllByRole("progressbar")).toHaveLength(2);
  });

  it("handles empty assignment list", () => {
    vi.mock("@/lib/api", () => ({
      useAssignments: () => ({
        data: [],
        isLoading: false,
      }),
      useStats: () => ({
        data: {
          completed: 0,
          pending: 0,
          total: 0,
        },
        isLoading: false,
      }),
    }));

    render(<Dashboard />);

    expect(screen.getByText(/no assignments found/i)).toBeInTheDocument();
  });
});
