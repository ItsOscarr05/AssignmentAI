import { ThemeProvider } from "@mui/material/styles";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { mockAssignments } from "../../../test/mocks/data";
import { theme } from "../../../theme";
import AIAssignmentGenerator from "../AIAssignmentGenerator";

// Mock the API client
jest.mock("../../../services/api", () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

describe("AIAssignmentGenerator", () => {
  const renderComponent = () => {
    return render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <AIAssignmentGenerator />
        </BrowserRouter>
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it("renders the form correctly", () => {
    renderComponent();

    // Check for form elements
    expect(screen.getByLabelText("Subject")).toBeInTheDocument();
    expect(screen.getByLabelText("Topic")).toBeInTheDocument();
    expect(screen.getByLabelText("Difficulty Level")).toBeInTheDocument();
    expect(screen.getByLabelText("Grade Level")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Estimated Duration (hours)")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Maximum Points")).toBeInTheDocument();
    expect(screen.getByText("Requirements")).toBeInTheDocument();
    expect(screen.getByText("Learning Objectives")).toBeInTheDocument();
  });

  it("allows adding requirements and learning objectives", () => {
    renderComponent();

    // Add a requirement
    fireEvent.click(screen.getByText("Add Requirement"));
    const requirementInput = screen.getByPlaceholderText("Enter requirement");
    fireEvent.change(requirementInput, {
      target: { value: "Test requirement" },
    });

    // Add a learning objective
    fireEvent.click(screen.getByText("Add Learning Objective"));
    const objectiveInput = screen.getByPlaceholderText(
      "Enter learning objective"
    );
    fireEvent.change(objectiveInput, { target: { value: "Test objective" } });

    // Verify inputs are present
    expect(screen.getByDisplayValue("Test requirement")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test objective")).toBeInTheDocument();
  });

  it("allows removing requirements and learning objectives", () => {
    renderComponent();

    // Add items
    fireEvent.click(screen.getByText("Add Requirement"));
    fireEvent.click(screen.getByText("Add Learning Objective"));

    // Remove items
    const removeButtons = screen.getAllByRole("button", { name: /remove/i });
    fireEvent.click(removeButtons[0]);
    fireEvent.click(removeButtons[1]);

    // Verify items are removed
    expect(
      screen.queryByPlaceholderText("Enter requirement")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Enter learning objective")
    ).not.toBeInTheDocument();
  });

  it("validates required fields before submission", async () => {
    renderComponent();

    // Try to generate without filling required fields
    fireEvent.click(screen.getByText("Generate Assignment"));

    // Check for validation messages
    expect(screen.getByText("Subject is required")).toBeInTheDocument();
    expect(screen.getByText("Topic is required")).toBeInTheDocument();
    expect(
      screen.getByText("Difficulty level is required")
    ).toBeInTheDocument();
    expect(screen.getByText("Grade level is required")).toBeInTheDocument();
  });

  it("successfully generates an assignment", async () => {
    // Mock the API response
    const { apiClient } = require("../../../services/api");
    apiClient.post.mockResolvedValueOnce({
      data: {
        content: {
          title: "Generated Assignment",
          description: "Test description",
          instructions: "Test instructions",
          rubric: "Test rubric",
          sampleSolution: "Test solution",
          suggestedResources: ["Resource 1", "Resource 2"],
          tags: ["test", "generated"],
        },
        metadata: {
          generationTime: 2.5,
          model: "gpt-4",
          confidence: 0.95,
        },
      },
    });

    renderComponent();

    // Fill in the form
    fireEvent.change(screen.getByLabelText("Subject"), {
      target: { value: "Computer Science" },
    });
    fireEvent.change(screen.getByLabelText("Topic"), {
      target: { value: "Programming Basics" },
    });
    fireEvent.change(screen.getByLabelText("Difficulty Level"), {
      target: { value: "beginner" },
    });
    fireEvent.change(screen.getByLabelText("Grade Level"), {
      target: { value: "9" },
    });
    fireEvent.change(screen.getByLabelText("Estimated Duration (hours)"), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText("Maximum Points"), {
      target: { value: "100" },
    });

    // Generate assignment
    fireEvent.click(screen.getByText("Generate Assignment"));

    // Wait for preview dialog
    await waitFor(() => {
      expect(screen.getByText("Generated Assignment")).toBeInTheDocument();
      expect(screen.getByText("Test description")).toBeInTheDocument();
      expect(screen.getByText("Test instructions")).toBeInTheDocument();
      expect(screen.getByText("Test rubric")).toBeInTheDocument();
      expect(screen.getByText("Test solution")).toBeInTheDocument();
      expect(screen.getByText("Resource 1")).toBeInTheDocument();
      expect(screen.getByText("Resource 2")).toBeInTheDocument();
      expect(screen.getByText("test")).toBeInTheDocument();
      expect(screen.getByText("generated")).toBeInTheDocument();
    });
  });

  it("handles API errors during generation", async () => {
    // Mock the API error
    const { apiClient } = require("../../../services/api");
    apiClient.post.mockRejectedValueOnce(
      new Error("Failed to generate assignment")
    );

    renderComponent();

    // Fill in the form
    fireEvent.change(screen.getByLabelText("Subject"), {
      target: { value: "Computer Science" },
    });
    fireEvent.change(screen.getByLabelText("Topic"), {
      target: { value: "Programming Basics" },
    });
    fireEvent.change(screen.getByLabelText("Difficulty Level"), {
      target: { value: "beginner" },
    });
    fireEvent.change(screen.getByLabelText("Grade Level"), {
      target: { value: "9" },
    });

    // Try to generate
    fireEvent.click(screen.getByText("Generate Assignment"));

    // Check for error message
    await waitFor(() => {
      expect(
        screen.getByText("Failed to generate assignment")
      ).toBeInTheDocument();
    });
  });

  it("allows saving generated assignment", async () => {
    // Mock the API responses
    const { apiClient } = require("../../../services/api");
    apiClient.post
      .mockResolvedValueOnce({
        data: {
          content: {
            title: "Generated Assignment",
            description: "Test description",
            instructions: "Test instructions",
            rubric: "Test rubric",
            sampleSolution: "Test solution",
            suggestedResources: ["Resource 1"],
            tags: ["test"],
          },
          metadata: {
            generationTime: 2.5,
            model: "gpt-4",
            confidence: 0.95,
          },
        },
      })
      .mockResolvedValueOnce({ data: { ...mockAssignments[0] } });

    renderComponent();

    // Fill in the form and generate
    fireEvent.change(screen.getByLabelText("Subject"), {
      target: { value: "Computer Science" },
    });
    fireEvent.change(screen.getByLabelText("Topic"), {
      target: { value: "Programming Basics" },
    });
    fireEvent.change(screen.getByLabelText("Difficulty Level"), {
      target: { value: "beginner" },
    });
    fireEvent.change(screen.getByLabelText("Grade Level"), {
      target: { value: "9" },
    });
    fireEvent.click(screen.getByText("Generate Assignment"));

    // Wait for preview dialog and save
    await waitFor(() => {
      expect(screen.getByText("Generated Assignment")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Save Assignment"));

    // Verify API call
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith("/api/assignments", {
        title: "Generated Assignment",
        description: "Test description",
        instructions: "Test instructions",
        rubric: "Test rubric",
        sampleSolution: "Test solution",
        suggestedResources: ["Resource 1"],
        tags: ["test"],
      });
    });
  });
});
