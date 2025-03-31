import { ThemeProvider } from "@mui/material/styles";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { mockSubmissions } from "../../../test/mocks/data";
import { theme } from "../../../theme";
import AIFeedbackViewer from "../AIFeedbackViewer";

// Mock the API client
jest.mock("../../../services/api", () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

// Mock window.print
const mockPrint = jest.fn();
Object.defineProperty(window, "print", {
  value: mockPrint,
  writable: true,
});

describe("AIFeedbackViewer", () => {
  const mockSubmission = mockSubmissions[0];

  const renderComponent = () => {
    return render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <AIFeedbackViewer submissionId={mockSubmission.id} />
        </BrowserRouter>
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it("renders the component correctly", async () => {
    // Mock the API response
    const { apiClient } = require("../../../services/api");
    apiClient.get.mockResolvedValueOnce({
      data: {
        submission: mockSubmission,
        analysis: {
          score: 85,
          strengths: ["Good code organization"],
          areasForImprovement: ["Error handling"],
          suggestions: ["Add try-catch blocks"],
          detailedAnalysis: "Overall good submission.",
        },
      },
    });

    renderComponent();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText("85%")).toBeInTheDocument();
      expect(screen.getByText("Good code organization")).toBeInTheDocument();
      expect(screen.getByText("Error handling")).toBeInTheDocument();
      expect(screen.getByText("Add try-catch blocks")).toBeInTheDocument();
      expect(screen.getByText("Overall good submission.")).toBeInTheDocument();
    });
  });

  it("displays loading state while fetching data", () => {
    renderComponent();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("displays error message when API call fails", async () => {
    // Mock the API error
    const { apiClient } = require("../../../services/api");
    apiClient.get.mockRejectedValueOnce(new Error("Failed to fetch feedback"));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Failed to load feedback")).toBeInTheDocument();
    });
  });

  it("opens print dialog when print button is clicked", async () => {
    // Mock the API response
    const { apiClient } = require("../../../services/api");
    apiClient.get.mockResolvedValueOnce({
      data: {
        submission: mockSubmission,
        analysis: {
          score: 85,
          strengths: ["Good code organization"],
          areasForImprovement: ["Error handling"],
          suggestions: ["Add try-catch blocks"],
          detailedAnalysis: "Overall good submission.",
        },
      },
    });

    renderComponent();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText("85%")).toBeInTheDocument();
    });

    // Click print button
    fireEvent.click(screen.getByText("Print Feedback"));

    // Verify print dialog was opened
    expect(mockPrint).toHaveBeenCalled();
  });

  it("opens print preview dialog with correct content", async () => {
    // Mock the API response
    const { apiClient } = require("../../../services/api");
    apiClient.get.mockResolvedValueOnce({
      data: {
        submission: mockSubmission,
        analysis: {
          score: 85,
          strengths: ["Good code organization"],
          areasForImprovement: ["Error handling"],
          suggestions: ["Add try-catch blocks"],
          detailedAnalysis: "Overall good submission.",
        },
      },
    });

    renderComponent();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText("85%")).toBeInTheDocument();
    });

    // Click print button
    fireEvent.click(screen.getByText("Print Feedback"));

    // Verify print preview dialog content
    expect(screen.getByText("Feedback Preview")).toBeInTheDocument();
    expect(screen.getByText("85%")).toBeInTheDocument();
    expect(screen.getByText("Good code organization")).toBeInTheDocument();
    expect(screen.getByText("Error handling")).toBeInTheDocument();
    expect(screen.getByText("Add try-catch blocks")).toBeInTheDocument();
    expect(screen.getByText("Overall good submission.")).toBeInTheDocument();
  });

  it("allows downloading feedback as PDF", async () => {
    // Mock the API response
    const { apiClient } = require("../../../services/api");
    apiClient.get.mockResolvedValueOnce({
      data: {
        submission: mockSubmission,
        analysis: {
          score: 85,
          strengths: ["Good code organization"],
          areasForImprovement: ["Error handling"],
          suggestions: ["Add try-catch blocks"],
          detailedAnalysis: "Overall good submission.",
        },
      },
    });

    renderComponent();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText("85%")).toBeInTheDocument();
    });

    // Click download button
    fireEvent.click(screen.getByText("Download PDF"));

    // Verify download link is created with correct content
    const downloadLink = screen.getByText("Download PDF");
    expect(downloadLink).toHaveAttribute(
      "download",
      `feedback-${mockSubmission.id}.pdf`
    );
  });

  it("allows sharing feedback", async () => {
    // Mock the Web Share API
    const mockShare = jest.fn();
    Object.defineProperty(navigator, "share", {
      value: mockShare,
      writable: true,
    });

    // Mock the API response
    const { apiClient } = require("../../../services/api");
    apiClient.get.mockResolvedValueOnce({
      data: {
        submission: mockSubmission,
        analysis: {
          score: 85,
          strengths: ["Good code organization"],
          areasForImprovement: ["Error handling"],
          suggestions: ["Add try-catch blocks"],
          detailedAnalysis: "Overall good submission.",
        },
      },
    });

    renderComponent();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText("85%")).toBeInTheDocument();
    });

    // Click share button
    fireEvent.click(screen.getByText("Share Feedback"));

    // Verify share was called with correct data
    expect(mockShare).toHaveBeenCalledWith({
      title: "Assignment Feedback",
      text: expect.stringContaining("85%"),
      url: expect.any(String),
    });
  });

  it("falls back to clipboard copy when Web Share API is not available", async () => {
    // Mock clipboard API
    const mockClipboard = {
      writeText: jest.fn(),
    };
    Object.defineProperty(navigator, "clipboard", {
      value: mockClipboard,
      writable: true,
    });

    // Mock the API response
    const { apiClient } = require("../../../services/api");
    apiClient.get.mockResolvedValueOnce({
      data: {
        submission: mockSubmission,
        analysis: {
          score: 85,
          strengths: ["Good code organization"],
          areasForImprovement: ["Error handling"],
          suggestions: ["Add try-catch blocks"],
          detailedAnalysis: "Overall good submission.",
        },
      },
    });

    renderComponent();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText("85%")).toBeInTheDocument();
    });

    // Click share button
    fireEvent.click(screen.getByText("Share Feedback"));

    // Verify clipboard was used
    expect(mockClipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining("85%")
    );
  });
});
