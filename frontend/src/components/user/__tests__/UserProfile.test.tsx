import { ThemeProvider } from "@mui/material/styles";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { mockUsers } from "../../../test/mocks/data";
import { theme } from "../../../theme";
import UserProfile from "../UserProfile";

// Mock the API client
jest.mock("../../../services/api", () => ({
  apiClient: {
    get: jest.fn(),
    put: jest.fn(),
  },
}));

const mockUser = mockUsers[0];

describe("UserProfile", () => {
  const renderComponent = () => {
    return render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <UserProfile userId={mockUser.id} />
        </BrowserRouter>
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it("renders user profile information correctly", async () => {
    // Mock the API response
    const { apiClient } = require("../../../services/api");
    apiClient.get.mockResolvedValueOnce({ data: mockUser });

    renderComponent();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("teacher@example.com")).toBeInTheDocument();
      expect(screen.getByText("Computer Science")).toBeInTheDocument();
      expect(screen.getByText("University of Example")).toBeInTheDocument();
    });
  });

  it("displays loading state while fetching data", () => {
    renderComponent();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("displays error message when API call fails", async () => {
    // Mock the API error
    const { apiClient } = require("../../../services/api");
    apiClient.get.mockRejectedValueOnce(new Error("Failed to fetch"));

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load user profile")
      ).toBeInTheDocument();
    });
  });

  it("allows editing profile information", async () => {
    // Mock the API responses
    const { apiClient } = require("../../../services/api");
    apiClient.get.mockResolvedValueOnce({ data: mockUser });
    apiClient.put.mockResolvedValueOnce({
      data: { ...mockUser, bio: "Updated bio" },
    });

    renderComponent();

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    // Click edit button
    fireEvent.click(screen.getByText("Edit Profile"));

    // Update bio
    const bioInput = screen.getByLabelText("Bio");
    fireEvent.change(bioInput, { target: { value: "Updated bio" } });

    // Save changes
    fireEvent.click(screen.getByText("Save Changes"));

    // Verify API call
    await waitFor(() => {
      expect(apiClient.put).toHaveBeenCalledWith(`/api/users/${mockUser.id}`, {
        bio: "Updated bio",
      });
    });

    // Verify UI update
    expect(screen.getByText("Updated bio")).toBeInTheDocument();
  });

  it("displays user statistics correctly", async () => {
    const { apiClient } = require("../../../services/api");
    apiClient.get.mockResolvedValueOnce({ data: mockUser });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("15")).toBeInTheDocument(); // totalAssignments
      expect(screen.getByText("85%")).toBeInTheDocument(); // averageGrade
      expect(screen.getByText("95%")).toBeInTheDocument(); // submissionRate
      expect(screen.getByText("150")).toBeInTheDocument(); // feedbackReceived
    });
  });

  it("displays recent activity correctly", async () => {
    const { apiClient } = require("../../../services/api");
    apiClient.get.mockResolvedValueOnce({ data: mockUser });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Created new assignment")).toBeInTheDocument();
      expect(screen.getByText("Graded submission")).toBeInTheDocument();
    });
  });
});
