import { ThemeProvider } from '@mui/material/styles';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { theme } from '../../../theme';
import { SubmissionViewer } from '../SubmissionViewer';

// Mock Material-UI components
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    Link: ({ children, href, download }: any) => (
      <a href={href} download={download} data-testid="mui-link">
        {children}
      </a>
    ),
    Box: ({ children }: any) => <div data-testid="mui-box">{children}</div>,
    Card: ({ children }: any) => <div data-testid="mui-card">{children}</div>,
    CardContent: ({ children }: any) => <div data-testid="mui-card-content">{children}</div>,
    Chip: ({ label, color }: any) => (
      <div data-testid="mui-chip" data-color={color}>
        {label}
      </div>
    ),
    Divider: () => <hr data-testid="mui-divider" />,
    List: ({ children }: any) => <ul data-testid="mui-list">{children}</ul>,
    ListItem: ({ children }: any) => <li data-testid="mui-list-item">{children}</li>,
    ListItemText: ({ primary, secondary }: any) => (
      <div data-testid="mui-list-item-text">
        {primary}
        {secondary}
      </div>
    ),
    Paper: ({ children }: any) => <div data-testid="mui-paper">{children}</div>,
    Typography: ({ children, variant, color }: any) => (
      <div data-testid="mui-typography" data-variant={variant} data-color={color}>
        {children}
      </div>
    ),
  };
});

describe('SubmissionViewer', () => {
  const mockAssignment = {
    id: '1',
    title: 'Test Assignment',
    description: 'Test Description',
    type: 'homework' as const,
    status: 'published' as const,
    dueDate: '2024-03-15T00:00:00Z',
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
    subject: 'Computer Science',
    gradeLevel: 'Undergraduate',
    priority: 'medium' as const,
    progress: 0,
    maxSubmissions: 3,
    allowLateSubmissions: true,
    lateSubmissionPenalty: 10,
    courseId: 'course-1',
    requirements: ['Requirement 1', 'Requirement 2'],
  };

  const mockSubmission = {
    id: '1',
    assignmentId: '1',
    studentId: 'user1',
    student: {
      id: 'user1',
      name: 'John Doe',
      email: 'john@example.com',
    },
    content: 'Test submission content',
    comments: 'Test comments',
    attachments: [
      {
        id: '1',
        name: 'image.jpg',
        url: 'https://example.com/image.jpg',
        type: 'image/jpeg',
        size: 1024,
      },
      {
        id: '2',
        name: 'document.pdf',
        url: 'https://example.com/document.pdf',
        type: 'application/pdf',
        size: 2048,
      },
    ],
    submittedAt: '2024-03-10T00:00:00Z',
    status: 'submitted',
    submissionCount: 1,
  };

  const mockFeedback = {
    id: '1',
    submissionId: '1',
    graderId: 'user2',
    grader: {
      id: 'user2',
      name: 'Jane Smith',
      email: 'jane@example.com',
    },
    grade: 85,
    comments: 'Good work overall, but could improve documentation',
    rubricScores: [
      {
        criterionId: '1',
        score: 8,
        comments: 'Code structure is good',
      },
      {
        criterionId: '2',
        score: 14,
        comments: 'Functionality meets requirements',
      },
      {
        criterionId: '3',
        score: 3,
        comments: 'Documentation needs improvement',
      },
    ],
    submittedAt: '2024-03-11T00:00:00Z',
  };

  const mockClassStatistics = {
    averageGrade: 82,
    highestGrade: 90,
    lowestGrade: 75,
    totalSubmissions: 25,
  };

  const renderComponent = (props = {}) => {
    return render(
      <ThemeProvider theme={theme}>
        <SubmissionViewer
          assignment={mockAssignment}
          submission={mockSubmission}
          feedback={mockFeedback}
          classStatistics={mockClassStatistics}
          {...props}
        />
      </ThemeProvider>
    );
  };

  it('renders the submission with all required information', () => {
    renderComponent();

    // Check submission header
    expect(screen.getByText(mockAssignment.title)).toBeTruthy();
    expect(screen.getByText(/Submitted by:.*John Doe.*\(john@example.com\)/)).toBeTruthy();

    // Check submission content
    expect(screen.getByText(mockSubmission.content)).toBeTruthy();
    expect(screen.getByText(mockSubmission.comments)).toBeTruthy();

    // Check submission metadata
    const date = new Date(mockSubmission.submittedAt).toLocaleDateString();
    expect(screen.getByText(`Submitted: ${date}`)).toBeTruthy();
    expect(screen.getByText(`Submission #${mockSubmission.submissionCount}`)).toBeTruthy();
  });

  it('displays assignment requirements', () => {
    renderComponent();

    const requirementsSection = screen
      .getByText('Requirements')
      .closest('[data-testid="mui-box"]') as HTMLElement;
    expect(requirementsSection).toBeTruthy();
    const requirementsList = within(requirementsSection).getByTestId('mui-list');
    mockAssignment.requirements.forEach(requirement => {
      expect(within(requirementsList).getByText(requirement)).toBeTruthy();
    });
  });

  it('displays attachments correctly', () => {
    renderComponent();

    const attachmentsSection = screen
      .getByText('Attachments')
      .closest('[data-testid="mui-box"]') as HTMLElement;
    expect(attachmentsSection).toBeTruthy();
    const attachmentsList = within(attachmentsSection).getByTestId('mui-list');
    mockSubmission.attachments.forEach(attachment => {
      const attachmentElement = within(attachmentsList).getByText(attachment.name);
      expect(attachmentElement).toBeTruthy();

      const sizeText = `${(attachment.size / 1024).toFixed(2)} KB`;
      const sizeElement = within(attachmentElement.closest('li')!).getByText(content =>
        content.includes(sizeText)
      );
      expect(sizeElement).toBeTruthy();
    });
  });

  it('displays file previews for supported file types', () => {
    renderComponent();

    const attachmentsSection = screen
      .getByText('Attachments')
      .closest('[data-testid="mui-box"]') as HTMLElement;
    const imageAttachment = mockSubmission.attachments.find(a => a.type.startsWith('image/'));
    expect(within(attachmentsSection).getByAltText(imageAttachment!.name)).toBeTruthy();
  });

  it('displays file download options', () => {
    renderComponent();

    const attachmentsSection = screen
      .getByText('Attachments')
      .closest('[data-testid="mui-box"]') as HTMLElement;
    const downloadLinks = within(attachmentsSection).getAllByTestId('mui-link');
    mockSubmission.attachments.forEach((attachment, index) => {
      expect(downloadLinks[index].getAttribute('href')).toBe(attachment.url);
      expect(downloadLinks[index].getAttribute('download')).toBe(attachment.name);
    });
  });

  it('displays class statistics', () => {
    renderComponent();

    const statsSection = screen
      .getByText('Class Statistics')
      .closest('[data-testid="mui-box"]') as HTMLElement;
    expect(statsSection).toBeTruthy();
    expect(
      within(statsSection).getByText(`Average Grade: ${mockClassStatistics.averageGrade}`)
    ).toBeTruthy();
    expect(
      within(statsSection).getByText(`Highest Grade: ${mockClassStatistics.highestGrade}`)
    ).toBeTruthy();
    expect(
      within(statsSection).getByText(`Lowest Grade: ${mockClassStatistics.lowestGrade}`)
    ).toBeTruthy();
    expect(
      within(statsSection).getByText(`Total Submissions: ${mockClassStatistics.totalSubmissions}`)
    ).toBeTruthy();
  });

  it('displays feedback information when available', () => {
    renderComponent();

    const feedbackSection = screen
      .getByText('Feedback')
      .closest('[data-testid="mui-box"]') as HTMLElement;
    expect(feedbackSection).toBeTruthy();

    // Check overall feedback
    expect(within(feedbackSection).getByText(/grade: 85/i)).toBeTruthy();
    expect(within(feedbackSection).getByText(mockFeedback.comments)).toBeTruthy();

    // Check grader information
    expect(within(feedbackSection).getByText(/graded by: jane smith/i)).toBeTruthy();

    // Check feedback date
    const feedbackDate = new Date(mockFeedback.submittedAt).toLocaleDateString();
    expect(within(feedbackSection).getByText(`Feedback provided: ${feedbackDate}`)).toBeTruthy();
  });

  it('displays submission status correctly', () => {
    renderComponent();

    const headerSection = screen
      .getByText(mockAssignment.title)
      .closest('[data-testid="mui-box"]') as HTMLElement;
    const chip = within(headerSection).getByTestId('mui-chip');
    expect(chip.textContent).toBe('Submitted');
    expect(chip.getAttribute('data-color')).toBe('success');

    // Test late submission
    const lateSubmission = {
      ...mockSubmission,
      submittedAt: '2024-03-16T00:00:00Z', // After due date
    };
    renderComponent({ submission: lateSubmission });

    // Get the last rendered instance of the title
    const titleElements = screen.getAllByText(mockAssignment.title);
    const lateHeaderSection = titleElements[titleElements.length - 1].closest(
      '[data-testid="mui-box"]'
    ) as HTMLElement;
    const lateChip = within(lateHeaderSection).getByTestId('mui-chip');
    expect(lateChip.textContent).toBe('Submitted Late');
    expect(lateChip.getAttribute('data-color')).toBe('warning');
  });
});
