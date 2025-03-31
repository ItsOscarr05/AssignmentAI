import { ThemeProvider } from "@mui/material/styles";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { mockUsers } from "../../../test/mocks/data";
import { theme } from "../../../theme";
import UserSettings from "../UserSettings";

// Mock the API client
jest.mock("../../../services/api", () => ({
  apiClient: {
    get: jest.fn(),
    put: jest.fn(),
  },
}));

const mockUser = mockUsers[0];

describe("UserSettings", () => {
  const renderComponent = () => {
    return render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <UserSettings userId={mockUser.id} />
        </BrowserRouter>
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it("renders user settings correctly", async () => {
    // Mock the API response
    const { apiClient } = require("../../../services/api");
    apiClient.get.mockResolvedValueOnce({ data: mockUser });

    renderComponent();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText("Theme")).toBeInTheDocument();
      expect(screen.getByText("Language")).toBeInTheDocument();
      expect(screen.getByText("Timezone")).toBeInTheDocument();
      expect(screen.getByText("Notifications")).toBeInTheDocument();
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
        screen.getByText("Failed to load user settings")
      ).toBeInTheDocument();
    });
  });

  it("allows updating theme preference", async () => {
    // Mock the API responses
    const { apiClient } = require("../../../services/api");
    apiClient.get.mockResolvedValueOnce({ data: mockUser });
    apiClient.put.mockResolvedValueOnce({
      data: {
        ...mockUser,
        preferences: { ...mockUser.preferences, theme: "dark" },
      },
    });

    renderComponent();

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText("Theme")).toBeInTheDocument();
    });

    // Change theme to dark
    const themeSelect = screen.getByLabelText("Theme");
    fireEvent.change(themeSelect, { target: { value: "dark" } });

    // Save changes
    fireEvent.click(screen.getByText("Save Changes"));

    // Verify API call
    await waitFor(() => {
      expect(apiClient.put).toHaveBeenCalledWith(`/api/users/${mockUser.id}`, {
        preferences: { ...mockUser.preferences, theme: "dark" },
      });
    });
  });

  it("allows updating notification preferences", async () => {
    // Mock the API responses
    const { apiClient } = require("../../../services/api");
    apiClient.get.mockResolvedValueOnce({ data: mockUser });
    apiClient.put.mockResolvedValueOnce({
      data: {
        ...mockUser,
        preferences: {
          ...mockUser.preferences,
          notifications: {
            ...mockUser.preferences.notifications,
            email: false,
          },
        },
      },
    });

    renderComponent();

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText("Email Notifications")).toBeInTheDocument();
    });

    // Toggle email notifications
    const emailToggle = screen.getByRole("checkbox", {
      name: /email notifications/i,
    });
    fireEvent.click(emailToggle);

    // Save changes
    fireEvent.click(screen.getByText("Save Changes"));

    // Verify API call
    await waitFor(() => {
      expect(apiClient.put).toHaveBeenCalledWith(`/api/users/${mockUser.id}`, {
        preferences: {
          ...mockUser.preferences,
          notifications: {
            ...mockUser.preferences.notifications,
            email: false,
          },
        },
      });
    });
  });

  it("allows updating accessibility settings", async () => {
    // Mock the API responses
    const { apiClient } = require("../../../services/api");
    apiClient.get.mockResolvedValueOnce({ data: mockUser });
    apiClient.put.mockResolvedValueOnce({
      data: {
        ...mockUser,
        preferences: {
          ...mockUser.preferences,
          accessibility: {
            ...mockUser.preferences.accessibility,
            highContrast: true,
          },
        },
      },
    });

    renderComponent();

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText("High Contrast Mode")).toBeInTheDocument();
    });

    // Enable high contrast mode
    const highContrastToggle = screen.getByRole("checkbox", {
      name: /high contrast mode/i,
    });
    fireEvent.click(highContrastToggle);

    // Save changes
    fireEvent.click(screen.getByText("Save Changes"));

    // Verify API call
    await waitFor(() => {
      expect(apiClient.put).toHaveBeenCalledWith(`/api/users/${mockUser.id}`, {
        preferences: {
          ...mockUser.preferences,
          accessibility: {
            ...mockUser.preferences.accessibility,
            highContrast: true,
          },
        },
      });
    });
  });
});
