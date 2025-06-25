import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Help from '../../pages/Help';
import { theme } from '../../theme';

// Mock the help service
vi.mock('../../services/helpService', () => ({
  helpService: {
    submitContactForm: vi.fn(),
    searchHelpArticles: vi.fn(),
    getHelpCategories: vi.fn(),
    getPopularArticles: vi.fn(),
    getArticleById: vi.fn(),
    submitFeedback: vi.fn(),
  },
}));

const renderHelp = () => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <Help />
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('Help Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders help page with FAQ tab by default', () => {
    renderHelp();
    expect(screen.getByText('Help & Support')).toBeInTheDocument();
    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
  });

  it('switches to contact tab when clicked', () => {
    renderHelp();
    const contactTab = screen.getByText('Contact');
    fireEvent.click(contactTab);
    expect(screen.getByText('Send us a Message')).toBeInTheDocument();
  });

  it('filters FAQ results when searching', () => {
    renderHelp();
    const searchInput = screen.getByPlaceholderText('Search for help...');
    fireEvent.change(searchInput, { target: { value: 'AI' } });

    // Should show AI-related questions
    expect(screen.getByText('How does the AI token system work?')).toBeInTheDocument();
  });

  it('shows no results message for non-matching search', () => {
    renderHelp();
    const searchInput = screen.getByPlaceholderText('Search for help...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    expect(screen.getByText('No Results Found')).toBeInTheDocument();
  });

  it('validates contact form fields', async () => {
    renderHelp();

    // Switch to contact tab
    const contactTab = screen.getByText('Contact');
    fireEvent.click(contactTab);

    // Try to submit empty form
    const submitButton = screen.getByText('Send Message');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please fill in all required fields')).toBeInTheDocument();
    });
  });

  it('handles contact form submission', async () => {
    renderHelp();

    // Switch to contact tab
    const contactTab = screen.getByText('Contact');
    fireEvent.click(contactTab);

    // Fill form
    const emailInput = screen.getByLabelText('Email Address');
    const subjectInput = screen.getByLabelText('Subject');
    const messageInput = screen.getByLabelText('Message');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(subjectInput, { target: { value: 'Test Subject' } });
    fireEvent.change(messageInput, { target: { value: 'Test message content' } });

    // Submit form
    const submitButton = screen.getByText('Send Message');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Sending...')).toBeInTheDocument();
    });
  });

  it('expands FAQ accordion when clicked', () => {
    renderHelp();
    const firstQuestion = screen.getByText('How do I get started with AssignmentAI?');
    fireEvent.click(firstQuestion);

    expect(screen.getByText(/To get started, simply log in/)).toBeInTheDocument();
  });

  it('handles quick link clicks', () => {
    renderHelp();
    const quickLinkButtons = screen.getAllByText('Visit');
    fireEvent.click(quickLinkButtons[0]);

    // Should show navigation message
    expect(screen.getByText(/Navigating to/)).toBeInTheDocument();
  });
});
