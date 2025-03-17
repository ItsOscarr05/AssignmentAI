import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import Dashboard from "../Dashboard";
import type { ReactNode } from "react";

interface MaterialUIProps {
  children?: ReactNode;
  [key: string]: any;
}

// Mock Material-UI components
vi.mock("@mui/material", () => ({
  Box: ({
    children,
    justifyContent,
    alignItems,
    minHeight,
    ...props
  }: MaterialUIProps) => (
    <div
      style={{
        justifyContent: justifyContent,
        alignItems: alignItems,
        minHeight: minHeight,
      }}
      {...props}
    >
      {children}
    </div>
  ),
  CircularProgress: () => <div data-testid="loading-spinner">Loading...</div>,
  Typography: ({
    children,
    gutterBottom,
    noWrap,
    ...props
  }: MaterialUIProps) => (
    <div
      style={{
        marginBottom: gutterBottom ? "0.35em" : undefined,
        whiteSpace: noWrap ? "nowrap" : undefined,
      }}
      {...props}
    >
      {children}
    </div>
  ),
  Button: ({
    children,
    onClick,
    ...props
  }: MaterialUIProps & { onClick?: () => void }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
  Card: ({ children, ...props }: MaterialUIProps) => (
    <div {...props}>{children}</div>
  ),
  CardContent: ({ children, ...props }: MaterialUIProps) => (
    <div {...props}>{children}</div>
  ),
  Grid: ({ children, item, container, ...props }: MaterialUIProps) => (
    <div data-item={item} data-container={container} {...props}>
      {children}
    </div>
  ),
  Alert: ({
    children,
    severity,
    ...props
  }: MaterialUIProps & { severity?: string }) => (
    <div data-severity={severity} role="alert" {...props}>
      {children}
    </div>
  ),
  Container: ({ children, maxWidth, ...props }: MaterialUIProps) => (
    <div
      style={{
        maxWidth: maxWidth === "lg" ? "1200px" : undefined,
      }}
      {...props}
    >
      {children}
    </div>
  ),
  Paper: ({ children, ...props }: MaterialUIProps) => (
    <div {...props}>{children}</div>
  ),
  CardActions: ({ children, ...props }: MaterialUIProps) => (
    <div {...props}>{children}</div>
  ),
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// Mock axios
vi.mock("axios");
const mockAxios = vi.mocked(axios, true);

// Mock process.env
vi.stubGlobal("process", {
  env: {
    REACT_APP_API_URL: "http://localhost:3000",
  },
});

// Mock AuthContext
const mockToken = "test-token";
const mockAuthContext = {
  user: { token: mockToken, full_name: "Test User" },
  login: vi.fn(),
  logout: vi.fn(),
};

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => mockAuthContext,
}));

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    mockAxios.get.mockImplementation(() => new Promise(() => {})); // Never resolves to keep loading state
    render(<Dashboard />);
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  it("displays error message when API call fails", async () => {
    const errorMessage = "Failed to fetch data";
    mockAxios.get.mockRejectedValueOnce({
      response: { data: { message: errorMessage } },
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it("renders dashboard with data", async () => {
    const mockAssignments = [
      {
        id: 1,
        subject: "Math",
        grade_level: "Grade 10",
        assignment_text: "Assignment 1 Description",
      },
      {
        id: 2,
        subject: "Science",
        grade_level: "Grade 10",
        assignment_text: "Assignment 2 Description",
      },
    ];
    const mockStats = {
      total: 10,
      completed: 5,
    };

    mockAxios.get.mockImplementation((url: string) => {
      if (url.includes("/assignments/recent")) {
        return Promise.resolve({ data: mockAssignments });
      }
      if (url.includes("/assignments/stats")) {
        return Promise.resolve({ data: mockStats });
      }
      return Promise.reject(new Error("Invalid URL"));
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Math")).toBeInTheDocument();
      expect(screen.getByText("Science")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument(); // Total assignments
    });
  });

  it("makes API calls with correct headers", async () => {
    mockAxios.get.mockImplementation((url: string) => {
      if (url.includes("/assignments/recent")) {
        return Promise.resolve({ data: [] });
      }
      if (url.includes("/assignments/stats")) {
        return Promise.resolve({ data: { total: 0, completed: 0 } });
      }
      return Promise.reject(new Error("Invalid URL"));
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(mockAxios.get).toHaveBeenCalledWith(
        "http://localhost:3000/assignments/recent",
        expect.objectContaining({
          headers: { Authorization: `Bearer ${mockToken}` },
        })
      );
    });
  });

  it("navigates to correct routes when clicking buttons", async () => {
    const mockAssignments = [
      {
        id: 1,
        subject: "Math",
        grade_level: "Grade 10",
        assignment_text: "Assignment 1 Description",
      },
    ];
    mockAxios.get.mockImplementation((url: string) => {
      if (url.includes("/assignments/recent")) {
        return Promise.resolve({ data: mockAssignments });
      }
      if (url.includes("/assignments/stats")) {
        return Promise.resolve({ data: { total: 1, completed: 0 } });
      }
      return Promise.reject(new Error("Invalid URL"));
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Math")).toBeInTheDocument();
    });

    const viewButton = screen.getByText("View Details");
    await userEvent.click(viewButton);

    expect(mockNavigate).toHaveBeenCalledWith("/assignments/1");
  });

  it("truncates long assignment text", async () => {
    const longText = "A".repeat(200);
    const mockAssignments = [
      {
        id: 1,
        subject: "Math",
        grade_level: "Grade 10",
        assignment_text: longText,
      },
    ];
    mockAxios.get.mockImplementation((url: string) => {
      if (url.includes("/assignments/recent")) {
        return Promise.resolve({ data: mockAssignments });
      }
      if (url.includes("/assignments/stats")) {
        return Promise.resolve({ data: { total: 1, completed: 0 } });
      }
      return Promise.reject(new Error("Invalid URL"));
    });

    render(<Dashboard />);

    await waitFor(() => {
      // Look for text that ends with "..." to ensure we're finding the truncated text
      const displayedText = screen.getByText((content) => {
        return content.startsWith("A") && content.endsWith("...");
      });
      expect(displayedText.textContent?.length).toBeLessThan(longText.length);
    });
  });
});
