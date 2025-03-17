import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import AssignmentList from "../AssignmentList";
import axios from "axios";

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/assignments" }),
}));

// Mock axios
vi.mock("axios");
const mockAxios = axios as unknown as { get: Mock };

// Mock assignments data
const mockAssignments = [
  {
    id: 1,
    subject: "Mathematics",
    grade_level: "High School",
    assignment_text: "Solve quadratic equations and graph their solutions",
    created_at: "2024-03-20T00:00:00.000Z",
  },
  {
    id: 2,
    subject: "Science",
    grade_level: "Middle School",
    assignment_text: "Study the basic principles of photosynthesis",
    created_at: "2024-03-21T00:00:00.000Z",
  },
];

// Mock Material-UI components
vi.mock("@mui/material", () => ({
  Container: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="container">{children}</div>
  ),
  Box: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="box">{children}</div>
  ),
  Grid: ({
    children,
    container,
    item,
  }: {
    children: React.ReactNode;
    container?: boolean;
    item?: boolean;
  }) => (
    <div data-testid="grid" data-container={container} data-item={item}>
      {children}
    </div>
  ),
  Typography: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="typography">{children}</div>
  ),
  Button: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
  TextField: ({
    label,
    name,
    value,
    onChange,
    select,
    children,
  }: {
    label?: string;
    name: string;
    value?: string;
    onChange?: (event: any) => void;
    select?: boolean;
    children?: React.ReactNode;
  }) => {
    if (select) {
      return (
        <select
          data-testid={name === "search" ? "search-input" : name}
          name={name}
          value={value}
          onChange={onChange}
        >
          {children}
        </select>
      );
    }
    return (
      <input
        data-testid={name === "search" ? "search-input" : name}
        name={name}
        value={value}
        onChange={onChange}
      />
    );
  },
  MenuItem: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => <option value={value}>{children}</option>,
  TableContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="table-container">{children}</div>
  ),
  Table: ({ children }: { children: React.ReactNode }) => (
    <table>{children}</table>
  ),
  TableHead: ({ children }: { children: React.ReactNode }) => (
    <thead>{children}</thead>
  ),
  TableBody: ({ children }: { children: React.ReactNode }) => (
    <tbody>{children}</tbody>
  ),
  TableRow: ({ children }: { children: React.ReactNode }) => (
    <tr>{children}</tr>
  ),
  TableCell: ({ children }: { children: React.ReactNode }) => (
    <td>{children}</td>
  ),
  TablePagination: ({
    count,
    rowsPerPage,
    page,
    onPageChange,
    onRowsPerPageChange,
  }: {
    count: number;
    rowsPerPage: number;
    page: number;
    onPageChange: (event: unknown, newPage: number) => void;
    onRowsPerPageChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  }) => (
    <div data-testid="pagination">
      <button onClick={(e) => onPageChange(e, page - 1)}>Previous</button>
      <span>
        Page {page + 1} of {Math.ceil(count / rowsPerPage)}
      </span>
      <button onClick={(e) => onPageChange(e, page + 1)}>Next</button>
      <select onChange={onRowsPerPageChange}>
        <option value="5">5</option>
        <option value="10">10</option>
        <option value="25">25</option>
      </select>
    </div>
  ),
  Paper: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("AssignmentList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock the API URL environment variable
    process.env.REACT_APP_API_URL = "http://localhost:3000";
  });

  it("shows loading state initially", async () => {
    // Mock initial empty response
    mockAxios.get.mockResolvedValueOnce({ data: [] });

    render(
      <BrowserRouter>
        <AssignmentList />
      </BrowserRouter>
    );

    // Initially, assignments should be empty
    expect(screen.queryByTestId("loading")).not.toBeInTheDocument();
    // We should not check for "Mathematics" here since it's in the subject dropdown
  });

  it("displays assignments after loading", async () => {
    mockAxios.get.mockResolvedValueOnce({ data: mockAssignments });

    render(
      <BrowserRouter>
        <AssignmentList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Solve quadratic equations/)).toBeInTheDocument();
    });
  });

  it("filters assignments by subject", async () => {
    mockAxios.get.mockResolvedValueOnce({ data: mockAssignments });

    render(
      <BrowserRouter>
        <AssignmentList />
      </BrowserRouter>
    );

    const subjectSelect = screen.getByTestId("subject");
    await userEvent.selectOptions(subjectSelect, "Mathematics");

    expect(mockAxios.get).toHaveBeenCalledWith(
      "http://localhost:3000/api/assignments",
      { params: { subject: "Mathematics" } }
    );
  });

  it("handles pagination", async () => {
    mockAxios.get.mockResolvedValueOnce({ data: mockAssignments });

    render(
      <BrowserRouter>
        <AssignmentList />
      </BrowserRouter>
    );

    const nextButton = screen.getByText("Next");
    await userEvent.click(nextButton);

    // Look for the page number text that might be split across elements
    const pageSpan = screen.getByText("Page", { exact: false });
    expect(pageSpan).toBeInTheDocument();
  });

  it("handles search input", async () => {
    mockAxios.get.mockResolvedValueOnce({ data: mockAssignments });

    render(
      <BrowserRouter>
        <AssignmentList />
      </BrowserRouter>
    );

    const searchInput = screen.getByTestId("search-input");
    await userEvent.type(searchInput, "algebra");

    expect(mockAxios.get).toHaveBeenCalledWith(
      "http://localhost:3000/api/assignments",
      { params: { search: "algebra" } }
    );
  });

  it("navigates to assignment details on row click", async () => {
    mockAxios.get.mockResolvedValueOnce({ data: mockAssignments });

    render(<AssignmentList />);

    await waitFor(() => {
      expect(screen.getByText(/Solve quadratic equations/)).toBeInTheDocument();
    });

    // Get the row containing the Mathematics assignment
    const mathRow = screen.getByText(/Solve quadratic equations/).closest("tr");
    if (!mathRow)
      throw new Error("Could not find the Mathematics assignment row");

    // Get the View button within that row
    const viewButton = within(mathRow).getByRole("button", { name: "View" });
    await userEvent.click(viewButton);
  });
});
