import { createTheme, ThemeProvider } from '@mui/material/styles';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import RubricViewer from '../RubricViewer';

// Create a test theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

describe('RubricViewer', () => {
  const mockRubric = {
    id: '1',
    assignmentId: '1',
    assignment: {
      id: '1',
      title: 'Test Assignment',
      dueDate: '2024-03-15T00:00:00Z',
    },
    name: 'Programming Rubric',
    description: 'Rubric for programming assignments',
    criteria: [
      {
        id: '1',
        name: 'Code Structure',
        description: 'Code organization and readability',
        maxScore: 10,
        weight: 0.3,
      },
      {
        id: '2',
        name: 'Functionality',
        description: 'Implementation meets requirements',
        maxScore: 15,
        weight: 0.5,
      },
      {
        id: '3',
        name: 'Documentation',
        description: 'Code documentation and comments',
        maxScore: 5,
        weight: 0.2,
      },
    ],
    totalMaxScore: 30,
    passingScore: 24,
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
  };

  const mockFeedback = {
    id: '1',
    submissionId: '1',
    submission: {
      id: '1',
      assignmentId: '1',
      studentId: 'student1',
      student: {
        id: 'student1',
        name: 'John Doe',
        email: 'john@example.com',
      },
      content: 'Test submission content',
      submittedAt: '2024-03-10T00:00:00Z',
      status: 'submitted',
    },
    grade: 28,
    comments: 'Great work! The code is well-structured and documented.',
    rubricScores: [
      {
        criterionId: '1',
        score: 9,
        comments: 'Excellent code organization',
      },
      {
        criterionId: '2',
        score: 14,
        comments: 'Most requirements met',
      },
      {
        criterionId: '3',
        score: 5,
        comments: 'Well documented',
      },
    ],
    submittedAt: '2024-03-11T00:00:00Z',
    grader: {
      id: 'grader1',
      name: 'Jane Smith',
      email: 'jane@example.com',
    },
  };

  const renderComponent = (props = {}) => {
    return render(
      <ThemeProvider theme={theme}>
        <RubricViewer rubric={mockRubric} feedback={mockFeedback} {...props} />
      </ThemeProvider>
    );
  };

  it('renders the rubric header with all required information', () => {
    renderComponent();

    expect(screen.getByText(mockRubric.name)).toBeInTheDocument();
    expect(screen.getByText(mockRubric.description)).toBeInTheDocument();
    expect(screen.getByText(`Total max score: ${mockRubric.totalMaxScore}`)).toBeInTheDocument();
    expect(screen.getByText(`Passing score: ${mockRubric.passingScore}`)).toBeInTheDocument();

    // Check creation and update dates
    const createdDate = new Date(mockRubric.createdAt).toLocaleDateString();
    const updatedDate = new Date(mockRubric.updatedAt).toLocaleDateString();
    expect(screen.getByText(`Created: ${createdDate}`)).toBeInTheDocument();
    expect(screen.getByText(`Updated: ${updatedDate}`)).toBeInTheDocument();
  });

  it('displays all rubric criteria with their details', () => {
    renderComponent();

    mockRubric.criteria.forEach(criterion => {
      // Use getAllByText and check if any of them match
      const nameElements = screen.getAllByText(criterion.name);
      expect(nameElements.length).toBeGreaterThan(0);

      expect(screen.getByText(criterion.description)).toBeInTheDocument();
      expect(screen.getByText(`${criterion.maxScore} points`)).toBeInTheDocument();
      expect(screen.getByText(`${(criterion.weight * 100).toFixed(0)}%`)).toBeInTheDocument();
    });
  });

  it('displays feedback information when available', () => {
    renderComponent();

    // Check overall feedback
    expect(
      screen.getByText('Comments: Great work! The code is well-structured and documented.')
    ).toBeInTheDocument();
    expect(screen.getByText('Grade: 28 (93%)')).toBeInTheDocument();

    // Check submission information
    expect(screen.getByText('Student: John Doe')).toBeInTheDocument();
    expect(screen.getByText('Email: john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Submitted: 3/9/2024')).toBeInTheDocument();

    // Check grader information
    expect(screen.getByText('Graded by: Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Grader Email: jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('Graded on: 3/10/2024')).toBeInTheDocument();
  });

  it('displays criterion scores and comments when feedback is available', () => {
    renderComponent();

    mockFeedback.rubricScores.forEach(score => {
      const criterion = mockRubric.criteria.find(c => c.id === score.criterionId);
      if (!criterion) {
        throw new Error(`Criterion with id ${score.criterionId} not found`);
      }

      // Look for the score in the table
      expect(screen.getByText(`${score.score}/${criterion.maxScore}`)).toBeInTheDocument();
      expect(screen.getByText(score.comments)).toBeInTheDocument();
    });
  });

  it('displays passing status based on grade', () => {
    renderComponent();

    // Test passing grade - look for the status text specifically
    expect(screen.getByText('Status: Passing')).toBeInTheDocument();

    // Test failing grade
    const failingFeedback = {
      ...mockFeedback,
      grade: 20,
    };
    renderComponent({ feedback: failingFeedback });
    expect(screen.getByText('Status: Not Passing')).toBeInTheDocument();
  });

  it('calculates and displays grade percentage correctly', () => {
    renderComponent();

    const percentage = ((mockFeedback.grade / mockRubric.totalMaxScore) * 100).toFixed(0);
    // Look for the percentage within the grade text
    expect(
      screen.getByText(content => content.includes(`Grade: ${mockFeedback.grade} (${percentage}%)`))
    ).toBeInTheDocument();
  });

  it('displays criteria in the correct order', () => {
    renderComponent();

    const criteriaElements = screen.getAllByText(/points/);
    mockRubric.criteria.forEach((criterion, index) => {
      expect(criteriaElements[index]).toHaveTextContent(`${criterion.maxScore} points`);
    });
  });

  it('displays weighted scores and total weighted score', () => {
    renderComponent();

    // Calculate total weighted score using the same method as the component
    const totalWeightedScore = (mockFeedback.grade / mockRubric.totalMaxScore) * 100;

    // Find the grade paragraph element
    const gradeParagraph = screen.getByText(/Grade:/).closest('p');
    expect(gradeParagraph).toBeInTheDocument();

    // Check that the paragraph contains all the required text
    const gradeText = gradeParagraph?.textContent || '';
    expect(gradeText).toContain('Grade:');
    expect(gradeText).toContain('28');
    expect(gradeText).toContain(`${totalWeightedScore.toFixed(0)}%`);
  });

  it('displays feedback submission date and grader information', () => {
    renderComponent();

    // Look for the grader name in the feedback summary
    expect(screen.getByText('Graded by: Jane Smith')).toBeInTheDocument();

    // Look for the submission date in the feedback summary
    expect(screen.getByText('Submitted: 3/9/2024')).toBeInTheDocument();
  });

  it('displays feedback status indicators based on scores', () => {
    renderComponent();

    const percentage = (mockFeedback.grade / mockRubric.totalMaxScore) * 100;

    if (percentage >= 90) {
      // Use getAllByText and check if any of them match
      const excellentElements = screen.getAllByText(/excellent/i);
      expect(excellentElements.length).toBeGreaterThan(0);
    } else if (percentage >= 80) {
      expect(screen.getByText(/good/i)).toBeInTheDocument();
    } else if (percentage >= 70) {
      expect(screen.getByText(/satisfactory/i)).toBeInTheDocument();
    } else {
      expect(screen.getByText(/needs improvement/i)).toBeInTheDocument();
    }
  });

  it('displays feedback summary with strengths and areas for improvement', () => {
    renderComponent();

    // Check for strengths (high scores)
    expect(screen.getByText(/strengths/i)).toBeInTheDocument();
    expect(screen.getByText(/excellent code organization/i)).toBeInTheDocument();

    // Check for areas for improvement (lower scores)
    expect(screen.getByText(/areas for improvement/i)).toBeInTheDocument();
    expect(screen.getByText(/most requirements met/i)).toBeInTheDocument();
  });

  it('displays feedback recommendations based on scores', () => {
    renderComponent();

    // Look for the recommendations in the feedback summary
    expect(screen.getByText('Excellent code organization')).toBeInTheDocument();
    expect(screen.getByText('Most requirements met')).toBeInTheDocument();
    expect(screen.getByText('Well documented')).toBeInTheDocument();
  });

  it('handles missing feedback gracefully', () => {
    renderComponent({ feedback: null });

    expect(screen.getByText(mockRubric.name)).toBeInTheDocument();
    expect(screen.getByText(mockRubric.description)).toBeInTheDocument();
    expect(screen.getByText(/no feedback available/i)).toBeInTheDocument();
  });

  it('displays feedback history when available', () => {
    const feedbackHistory = [
      {
        id: '1',
        grade: 85,
        submittedAt: '2024-03-10T10:00:00Z',
        grader: { name: 'Jane Smith', email: 'jane@example.com' },
      },
      {
        id: '2',
        grade: 90,
        submittedAt: '2024-03-11T14:30:00Z',
        grader: { name: 'John Doe', email: 'john@example.com' },
      },
    ];

    renderComponent({ feedbackHistory });

    // Look for the feedback history section
    const feedbackHistorySection = screen
      .getByText('Feedback History')
      .closest('[data-testid="card"]') as HTMLElement;
    expect(feedbackHistorySection).toBeInTheDocument();

    // Get list item text elements within the feedback history section
    const listItemTexts = within(feedbackHistorySection).getAllByTestId('list-item-text');

    // Check each feedback entry
    feedbackHistory.forEach((feedback, index) => {
      const listItemText = listItemTexts[index];

      // Check the primary text (grade)
      const expectedGradeText = `Grade: ${feedback.grade} (${(
        (feedback.grade / mockRubric.totalMaxScore) *
        100
      ).toFixed(0)}%)`;
      expect(listItemText).toHaveAttribute('primary', expectedGradeText);

      // Check the secondary text (submission info)
      const expectedSubmissionText = `Submitted: ${new Date(
        feedback.submittedAt
      ).toLocaleDateString()} by ${feedback.grader.name}`;
      expect(listItemText).toHaveAttribute('secondary', expectedSubmissionText);
    });
  });

  it('displays feedback comparison when multiple submissions exist', () => {
    const feedbackHistory = [
      {
        ...mockFeedback,
        id: '1',
        submittedAt: '2024-03-11T00:00:00Z',
      },
      {
        ...mockFeedback,
        id: '2',
        grade: 25,
        submittedAt: '2024-03-12T00:00:00Z',
      },
    ];

    renderComponent({ feedbackHistory });

    expect(screen.getByText(/feedback comparison/i)).toBeInTheDocument();
    expect(screen.getByText(/average grade/i)).toBeInTheDocument();
    expect(screen.getByText(/highest grade/i)).toBeInTheDocument();
    expect(screen.getByText(/lowest grade/i)).toBeInTheDocument();
  });
});
