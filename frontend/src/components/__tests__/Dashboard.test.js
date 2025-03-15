import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../../contexts/AuthContext";
import Dashboard from "../Dashboard";

// Create a wrapper component that provides necessary context
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const AllTheProviders = ({ children }) => {
  const testQueryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={testQueryClient}>
      <AuthProvider>
        <BrowserRouter>{children}</BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe("Dashboard Component", () => {
  beforeEach(() => {
    // Mock localStorage
    const mockUser = {
      token: "fake-jwt-token",
      full_name: "Test User",
    };
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === "user") {
        return JSON.stringify(mockUser);
      }
      return null;
    });
  });

  it("renders welcome message with user name", async () => {
    render(<Dashboard />, { wrapper: AllTheProviders });

    await waitFor(() => {
      expect(screen.getByText(/Welcome back, Test User!/i)).toBeInTheDocument();
    });
  });

  it("displays loading state initially", () => {
    render(<Dashboard />, { wrapper: AllTheProviders });
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("displays assignment statistics", async () => {
    render(<Dashboard />, { wrapper: AllTheProviders });

    await waitFor(() => {
      expect(screen.getByText("10")).toBeInTheDocument(); // Total assignments
      expect(screen.getByText("5")).toBeInTheDocument(); // Completed assignments
    });
  });

  it("displays recent assignments", async () => {
    render(<Dashboard />, { wrapper: AllTheProviders });

    await waitFor(() => {
      expect(screen.getByText("Math")).toBeInTheDocument();
      expect(screen.getByText("English")).toBeInTheDocument();
    });
  });

  it("displays quick action buttons", async () => {
    render(<Dashboard />, { wrapper: AllTheProviders });

    await waitFor(() => {
      expect(screen.getByText("New Assignment")).toBeInTheDocument();
      expect(screen.getByText("View All Assignments")).toBeInTheDocument();
    });
  });
});
