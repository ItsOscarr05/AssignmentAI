import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SnackbarProvider } from 'notistack';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTemplates } from '../../../hooks/useTemplates';
import { theme } from '../../../theme';
import CustomAssignmentTemplates from '../CustomAssignmentTemplates';

// Mock the templates API
vi.mock('../../../services/api/templates', () => ({
  getTemplates: vi.fn(),
  createTemplate: vi.fn(),
  updateTemplate: vi.fn(),
  deleteTemplate: vi.fn(),
}));

// Mock the useTemplates hook
vi.mock('../../../hooks/useTemplates', () => ({
  useTemplates: vi.fn(),
}));

const mockUseTemplates = vi.mocked(useTemplates);

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <SnackbarProvider>{component}</SnackbarProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

describe('CustomAssignmentTemplates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set default mock return value
    mockUseTemplates.mockReturnValue({
      templates: [
        {
          id: '1',
          name: 'Essay Template',
          description: 'A comprehensive essay template',
          content: 'This is the essay template content...',
          category: 'essay',
          tags: ['writing', 'academic'],
          usageCount: 15,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
        {
          id: '2',
          name: 'Math Problem Template',
          description: 'Template for solving math problems',
          content: 'This is the math template content...',
          category: 'mathematics',
          tags: ['math', 'problem-solving'],
          usageCount: 8,
          createdAt: '2024-01-14T09:00:00Z',
          updatedAt: '2024-01-14T09:00:00Z',
        },
      ],
      loading: false,
      error: null,
      createTemplate: vi.fn(),
      updateTemplate: vi.fn(),
      deleteTemplate: vi.fn(),
      refreshTemplates: vi.fn(),
    });
  });

  describe('Loading State', () => {
    it('should show loading state initially', () => {
      mockUseTemplates.mockReturnValue({
        templates: [],
        loading: true,
        error: null,
        createTemplate: vi.fn(),
        updateTemplate: vi.fn(),
        deleteTemplate: vi.fn(),
        refreshTemplates: vi.fn(),
      });

      renderWithProviders(<CustomAssignmentTemplates />);

      expect(screen.getByText('Loading templates...')).toBeTruthy();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no templates exist', () => {
      mockUseTemplates.mockReturnValue({
        templates: [],
        loading: false,
        error: null,
        createTemplate: vi.fn(),
        updateTemplate: vi.fn(),
        deleteTemplate: vi.fn(),
        refreshTemplates: vi.fn(),
      });

      renderWithProviders(<CustomAssignmentTemplates />);

      expect(screen.getByText('No templates found')).toBeTruthy();
      expect(screen.getByText('Create your first template to get started')).toBeTruthy();
    });
  });

  describe('Template Display', () => {
    it('should render template list correctly', () => {
      renderWithProviders(<CustomAssignmentTemplates />);

      expect(screen.getByText('Essay Template')).toBeTruthy();
      expect(screen.getByText('Math Problem Template')).toBeTruthy();
      expect(screen.getByText('A comprehensive essay template')).toBeTruthy();
      expect(screen.getByText('Template for solving math problems')).toBeTruthy();
    });

    it('should display create template button', () => {
      mockUseTemplates.mockReturnValue({
        templates: [],
        loading: false,
        error: null,
        createTemplate: vi.fn(),
        updateTemplate: vi.fn(),
        deleteTemplate: vi.fn(),
        refreshTemplates: vi.fn(),
      });

      renderWithProviders(<CustomAssignmentTemplates />);

      expect(screen.getAllByText('Create Template')).toHaveLength(2);
    });
  });

  describe('Create Template', () => {
    it('should open create dialog when create button is clicked', () => {
      mockUseTemplates.mockReturnValue({
        templates: [],
        loading: false,
        error: null,
        createTemplate: vi.fn(),
        updateTemplate: vi.fn(),
        deleteTemplate: vi.fn(),
        refreshTemplates: vi.fn(),
      });

      renderWithProviders(<CustomAssignmentTemplates />);

      const createButtons = screen.getAllByText('Create Template');
      const createButton = createButtons[0]; // Use the first one
      fireEvent.click(createButton);

      expect(screen.getByText('Create New Template')).toBeTruthy();
    });

    it('should create template successfully', async () => {
      const mockCreateTemplate = vi.fn().mockResolvedValue({ success: true });
      mockUseTemplates.mockReturnValue({
        templates: [],
        loading: false,
        error: null,
        createTemplate: mockCreateTemplate,
        updateTemplate: vi.fn(),
        deleteTemplate: vi.fn(),
        refreshTemplates: vi.fn(),
      });

      renderWithProviders(<CustomAssignmentTemplates />);

      const createButtons = screen.getAllByText('Create Template');
      const createButton = createButtons[0]; // Use the first one
      fireEvent.click(createButton);

      const nameInput = screen.getByLabelText('Template Name');
      const descriptionInput = screen.getByLabelText('Description');
      const contentInput = screen.getByLabelText('Template Content');

      fireEvent.change(nameInput, { target: { value: 'New Template' } });
      fireEvent.change(descriptionInput, { target: { value: 'A new template' } });
      fireEvent.change(contentInput, { target: { value: 'Template content here' } });

      const submitButton = screen.getByText('Create');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCreateTemplate).toHaveBeenCalledWith({
          name: 'New Template',
          description: 'A new template',
          content: 'Template content here',
          category: 'general',
          tags: [],
        });
      });
    });

    it('should validate required fields', () => {
      mockUseTemplates.mockReturnValue({
        templates: [],
        loading: false,
        error: null,
        createTemplate: vi.fn(),
        updateTemplate: vi.fn(),
        deleteTemplate: vi.fn(),
        refreshTemplates: vi.fn(),
      });

      renderWithProviders(<CustomAssignmentTemplates />);

      const createButtons = screen.getAllByText('Create Template');
      const createButton = createButtons[0]; // Use the first one
      fireEvent.click(createButton);

      const submitButton = screen.getByText('Create');
      fireEvent.click(submitButton);

      expect(screen.getByText('Name is required')).toBeTruthy();
      expect(screen.getByText('Description is required')).toBeTruthy();
      expect(screen.getByText('Content is required')).toBeTruthy();
    });
  });

  describe('Edit Template', () => {
    it('should open edit dialog when edit button is clicked', () => {
      renderWithProviders(<CustomAssignmentTemplates />);

      const editButtons = screen.getAllByTestId('edit-template-button');
      fireEvent.click(editButtons[0]);

      expect(screen.getByText('Edit Template')).toBeTruthy();
    });

    it('should update template successfully', async () => {
      const mockUpdateTemplate = vi.fn().mockResolvedValue({ success: true });
      mockUseTemplates.mockReturnValue({
        templates: [
          {
            id: '1',
            name: 'Essay Template',
            description: 'A comprehensive essay template',
            content: 'This is the essay template content...',
            category: 'essay',
            tags: ['writing', 'academic'],
            usageCount: 15,
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:00:00Z',
          },
        ],
        loading: false,
        error: null,
        createTemplate: vi.fn(),
        updateTemplate: mockUpdateTemplate,
        deleteTemplate: vi.fn(),
        refreshTemplates: vi.fn(),
      });

      renderWithProviders(<CustomAssignmentTemplates />);

      const editButton = screen.getByTestId('edit-template-button');
      fireEvent.click(editButton);

      const nameInput = screen.getByLabelText('Template Name');
      fireEvent.change(nameInput, { target: { value: 'Updated Template' } });

      const submitButton = screen.getByText('Update');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateTemplate).toHaveBeenCalledWith('1', {
          name: 'Updated Template',
          description: 'A comprehensive essay template',
          content: 'This is the essay template content...',
          category: 'essay',
          tags: ['writing', 'academic'],
        });
      });
    });
  });

  describe('Delete Template', () => {
    it('should delete template when confirmed', async () => {
      const mockDeleteTemplate = vi.fn().mockResolvedValue({ success: true });
      mockUseTemplates.mockReturnValue({
        templates: [
          {
            id: '1',
            name: 'Essay Template',
            description: 'A comprehensive essay template',
            content: 'This is the essay template content...',
            category: 'essay',
            tags: ['writing', 'academic'],
            usageCount: 15,
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:00:00Z',
          },
        ],
        loading: false,
        error: null,
        createTemplate: vi.fn(),
        updateTemplate: vi.fn(),
        deleteTemplate: mockDeleteTemplate,
        refreshTemplates: vi.fn(),
      });

      renderWithProviders(<CustomAssignmentTemplates />);

      const deleteButton = screen.getByTestId('delete-template-button');
      fireEvent.click(deleteButton);

      const confirmButton = screen.getByText('Delete');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockDeleteTemplate).toHaveBeenCalledWith('1');
      });
    });

    it('should not delete template when cancelled', () => {
      const mockDeleteTemplate = vi.fn();
      const mockConfirm = vi.fn().mockReturnValue(false);
      Object.defineProperty(window, 'confirm', {
        writable: true,
        value: mockConfirm,
      });

      mockUseTemplates.mockReturnValue({
        templates: [
          {
            id: '1',
            name: 'Essay Template',
            description: 'A comprehensive essay template',
            content: 'This is the essay template content...',
            category: 'essay',
            tags: ['writing', 'academic'],
            usageCount: 15,
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:00:00Z',
          },
        ],
        loading: false,
        error: null,
        createTemplate: vi.fn(),
        updateTemplate: vi.fn(),
        deleteTemplate: mockDeleteTemplate,
        refreshTemplates: vi.fn(),
      });

      renderWithProviders(<CustomAssignmentTemplates />);

      const deleteButton = screen.getByTestId('delete-template-button');
      fireEvent.click(deleteButton);

      expect(mockDeleteTemplate).not.toHaveBeenCalled();
    });
  });

  describe('Copy Template', () => {
    it('should copy template content to clipboard', () => {
      renderWithProviders(<CustomAssignmentTemplates />);

      const copyButtons = screen.getAllByTestId('copy-template-button');
      const copyButton = copyButtons[0]; // Use the first one
      fireEvent.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'This is the essay template content...'
      );
    });
  });

  describe('Use Template', () => {
    it('should log template usage when use button is clicked', () => {
      const mockRefreshTemplates = vi.fn();
      mockUseTemplates.mockReturnValue({
        templates: [
          {
            id: '1',
            name: 'Essay Template',
            description: 'A comprehensive essay template',
            content: 'This is the essay template content...',
            category: 'essay',
            tags: ['writing', 'academic'],
            usageCount: 15,
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:00:00Z',
          },
        ],
        loading: false,
        error: null,
        createTemplate: vi.fn(),
        updateTemplate: vi.fn(),
        deleteTemplate: vi.fn(),
        refreshTemplates: mockRefreshTemplates,
      });

      renderWithProviders(<CustomAssignmentTemplates />);

      const useButton = screen.getByTestId('use-template-button');
      fireEvent.click(useButton);

      expect(mockRefreshTemplates).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should show error message when API fails', () => {
      mockUseTemplates.mockReturnValue({
        templates: [],
        loading: false,
        error: 'Failed to load templates',
        createTemplate: vi.fn(),
        updateTemplate: vi.fn(),
        deleteTemplate: vi.fn(),
        refreshTemplates: vi.fn(),
      });

      renderWithProviders(<CustomAssignmentTemplates />);

      expect(screen.getByText('Failed to load templates')).toBeTruthy();
    });

    it('should show error when create template fails', async () => {
      const mockCreateTemplate = vi.fn().mockRejectedValue(new Error('Creation failed'));
      mockUseTemplates.mockReturnValue({
        templates: [],
        loading: false,
        error: null,
        createTemplate: mockCreateTemplate,
        updateTemplate: vi.fn(),
        deleteTemplate: vi.fn(),
        refreshTemplates: vi.fn(),
      });

      renderWithProviders(<CustomAssignmentTemplates />);

      const createButtons = screen.getAllByText('Create Template');
      const createButton = createButtons[0]; // Use the first one
      fireEvent.click(createButton);

      const nameInput = screen.getByLabelText('Template Name');
      const descriptionInput = screen.getByLabelText('Description');
      const contentInput = screen.getByLabelText('Template Content');

      fireEvent.change(nameInput, { target: { value: 'New Template' } });
      fireEvent.change(descriptionInput, { target: { value: 'A new template' } });
      fireEvent.change(contentInput, { target: { value: 'Template content here' } });

      const submitButton = screen.getByText('Create');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to create template')).toBeTruthy();
      });
    });
  });

  describe('Category Options', () => {
    it('should display all category options in select', () => {
      mockUseTemplates.mockReturnValue({
        templates: [],
        loading: false,
        error: null,
        createTemplate: vi.fn(),
        updateTemplate: vi.fn(),
        deleteTemplate: vi.fn(),
        refreshTemplates: vi.fn(),
      });

      renderWithProviders(<CustomAssignmentTemplates />);

      const createButtons = screen.getAllByText('Create Template');
      const createButton = createButtons[0]; // Use the first one
      fireEvent.click(createButton);

      const categorySelect = screen.getByLabelText('Category');
      fireEvent.mouseDown(categorySelect);

      expect(screen.getByText('General')).toBeTruthy();
      expect(screen.getByText('Essay')).toBeTruthy();
      expect(screen.getByText('Mathematics')).toBeTruthy();
      expect(screen.getByText('Science')).toBeTruthy();
      expect(screen.getByText('History')).toBeTruthy();
    });
  });
});
