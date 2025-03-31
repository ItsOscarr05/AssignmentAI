import { ThemeProvider } from "@mui/material/styles";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { mockSubmissions } from "../../../test/mocks/data";
import { theme } from "../../../theme";
import AISubmissionAnalyzer from "../AISubmissionAnalyzer";

// Mock the API client
jest.mock("../../../services/api", () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

// Mock file upload
const mockFile = new File(["test content"], "test.pdf", {
  type: "application/pdf",
});

describe("AISubmissionAnalyzer", () => {
  const mockSubmission = mockSubmissions[0];

  const renderComponent = () => {
    return render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <AISubmissionAnalyzer submissionId={mockSubmission.id} />
        </BrowserRouter>
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it("renders the component correctly", () => {
    renderComponent();

    // Check for main elements
    expect(screen.getByText("Upload Submission")).toBeInTheDocument();
    expect(screen.getByText("Analysis Results")).toBeInTheDocument();
    expect(screen.getByText("Feedback")).toBeInTheDocument();
  });

  it("handles file upload correctly", async () => {
    // Mock the API response
    const { apiClient } = require("../../../services/api");
    apiClient.post.mockResolvedValueOnce({
      data: {
        analysis: {
          score: 85,
          strengths: ["Good code organization", "Clear comments"],
          areasForImprovement: ["Error handling", "Documentation"],
          suggestions: [
            "Add try-catch blocks",
            "Include more detailed comments",
          ],
          detailedAnalysis:
            "Overall good submission with room for improvement.",
        },
      },
    });

    renderComponent();

    // Get the file input
    const fileInput = screen.getByLabelText("Upload Submission");

    // Simulate file upload
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    // Wait for analysis results
    await waitFor(() => {
      expect(screen.getByText("85%")).toBeInTheDocument();
      expect(screen.getByText("Good code organization")).toBeInTheDocument();
      expect(screen.getByText("Error handling")).toBeInTheDocument();
      expect(screen.getByText("Add try-catch blocks")).toBeInTheDocument();
      expect(
        screen.getByText("Overall good submission with room for improvement.")
      ).toBeInTheDocument();
    });
  });

  it("validates file type and size", async () => {
    // Create a large file (>10MB)
    const largeFile = new File(["x".repeat(11 * 1024 * 1024)], "large.pdf", {
      type: "application/pdf",
    });

    // Create an invalid file type
    const invalidFile = new File(["test"], "test.txt", { type: "text/plain" });

    renderComponent();

    // Get the file input
    const fileInput = screen.getByLabelText("Upload Submission");

    // Try uploading invalid file type
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });
    expect(
      screen.getByText(
        "Invalid file type. Please upload a PDF, DOC, DOCX, or TXT file."
      )
    ).toBeInTheDocument();

    // Try uploading large file
    fireEvent.change(fileInput, { target: { files: [largeFile] } });
    expect(
      screen.getByText("File size exceeds 10MB limit.")
    ).toBeInTheDocument();
  });

  it("handles API errors during analysis", async () => {
    // Mock the API error
    const { apiClient } = require("../../../services/api");
    apiClient.post.mockRejectedValueOnce(
      new Error("Failed to analyze submission")
    );

    renderComponent();

    // Get the file input and upload a file
    const fileInput = screen.getByLabelText("Upload Submission");
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    // Check for error message
    await waitFor(() => {
      expect(
        screen.getByText("Failed to analyze submission")
      ).toBeInTheDocument();
    });
  });

  it("allows editing and saving feedback", async () => {
    // Mock the API responses
    const { apiClient } = require("../../../services/api");
    apiClient.post
      .mockResolvedValueOnce({
        data: {
          analysis: {
            score: 85,
            strengths: ["Good code organization"],
            areasForImprovement: ["Error handling"],
            suggestions: ["Add try-catch blocks"],
            detailedAnalysis: "Overall good submission.",
          },
        },
      })
      .mockResolvedValueOnce({
        data: { ...mockSubmission, feedback: "Updated feedback" },
      });

    renderComponent();

    // Upload a file and wait for analysis
    const fileInput = screen.getByLabelText("Upload Submission");
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    await waitFor(() => {
      expect(screen.getByText("85%")).toBeInTheDocument();
    });

    // Edit feedback
    const feedbackInput = screen.getByLabelText("Feedback");
    fireEvent.change(feedbackInput, { target: { value: "Updated feedback" } });

    // Save feedback
    fireEvent.click(screen.getByText("Save Feedback"));

    // Verify API call
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        `/api/submissions/${mockSubmission.id}/feedback`,
        {
          feedback: "Updated feedback",
        }
      );
    });
  });

  it("displays loading states during API calls", async () => {
    // Mock the API response with a delay
    const { apiClient } = require("../../../services/api");
    apiClient.post.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    renderComponent();

    // Upload a file
    const fileInput = screen.getByLabelText("Upload Submission");
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    // Check for loading state
    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    });
  });
});
