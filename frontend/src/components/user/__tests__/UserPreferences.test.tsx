import { ThemeProvider } from "@mui/material/styles";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { mockUsers } from "../../../test/mocks/data";
import { theme } from "../../../theme";
import UserPreferences from "../UserPreferences";

// Mock the API client
jest.mock("../../../services/api", () => ({
  apiClient: {
    get: jest.fn(),
    put: jest.fn(),
  },
}));

const mockUser = mockUsers[0];

describe("UserPreferences", () => {
  const renderComponent = () => {
    return render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <UserPreferences userId={mockUser.id} />
        </BrowserRouter>
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it("renders user preferences correctly", async () => {
    // Mock the API response
    const { apiClient } = require("../../../services/api");
    apiClient.get.mockResolvedValueOnce({ data: mockUser });

    renderComponent();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText("Assignment Display")).toBeInTheDocument();
      expect(screen.getByText("Grading Preferences")).toBeInTheDocument();
      expect(screen.getByText("AI Assistant Preferences")).toBeInTheDocument();
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
        screen.getByText("Failed to load user preferences")
      ).toBeInTheDocument();
    });
  });

  it("allows updating assignment display preferences", async () => {
    // Mock the API responses
    const { apiClient } = require("../../../services/api");
    apiClient.get.mockResolvedValueOnce({ data: mockUser });
    apiClient.put.mockResolvedValueOnce({
      data: {
        ...mockUser,
        preferences: {
          ...mockUser.preferences,
          assignmentDisplay: {
            ...mockUser.preferences.assignmentDisplay,
            showDueDates: false,
          },
        },
      },
    });

    renderComponent();

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText("Show Due Dates")).toBeInTheDocument();
    });

    // Toggle show due dates
    const dueDatesToggle = screen.getByRole("checkbox", {
      name: /show due dates/i,
    });
    fireEvent.click(dueDatesToggle);

    // Save changes
    fireEvent.click(screen.getByText("Save Changes"));

    // Verify API call
    await waitFor(() => {
      expect(apiClient.put).toHaveBeenCalledWith(`/api/users/${mockUser.id}`, {
        preferences: {
          ...mockUser.preferences,
          assignmentDisplay: {
            ...mockUser.preferences.assignmentDisplay,
            showDueDates: false,
          },
        },
      });
    });
  });

  it("allows updating grading preferences", async () => {
    // Mock the API responses
    const { apiClient } = require("../../../services/api");
    apiClient.get.mockResolvedValueOnce({ data: mockUser });
    apiClient.put.mockResolvedValueOnce({
      data: {
        ...mockUser,
        preferences: {
          ...mockUser.preferences,
          grading: {
            ...mockUser.preferences.grading,
            defaultRubric: "custom",
          },
        },
      },
    });

    renderComponent();

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText("Default Rubric")).toBeInTheDocument();
    });

    // Change default rubric
    const rubricSelect = screen.getByLabelText("Default Rubric");
    fireEvent.change(rubricSelect, { target: { value: "custom" } });

    // Save changes
    fireEvent.click(screen.getByText("Save Changes"));

    // Verify API call
    await waitFor(() => {
      expect(apiClient.put).toHaveBeenCalledWith(`/api/users/${mockUser.id}`, {
        preferences: {
          ...mockUser.preferences,
          grading: {
            ...mockUser.preferences.grading,
            defaultRubric: "custom",
          },
        },
      });
    });
  });

  it("allows updating AI assistant preferences", async () => {
    // Mock the API responses
    const { apiClient } = require("../../../services/api");
    apiClient.get.mockResolvedValueOnce({ data: mockUser });
    apiClient.put.mockResolvedValueOnce({
      data: {
        ...mockUser,
        preferences: {
          ...mockUser.preferences,
          aiAssistant: {
            ...mockUser.preferences.aiAssistant,
            feedbackDetail: "detailed",
          },
        },
      },
    });

    renderComponent();

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText("Feedback Detail Level")).toBeInTheDocument();
    });

    // Change feedback detail level
    const detailSelect = screen.getByLabelText("Feedback Detail Level");
    fireEvent.change(detailSelect, { target: { value: "detailed" } });

    // Save changes
    fireEvent.click(screen.getByText("Save Changes"));

    // Verify API call
    await waitFor(() => {
      expect(apiClient.put).toHaveBeenCalledWith(`/api/users/${mockUser.id}`, {
        preferences: {
          ...mockUser.preferences,
          aiAssistant: {
            ...mockUser.preferences.aiAssistant,
            feedbackDetail: "detailed",
          },
        },
      });
    });
  });
});
