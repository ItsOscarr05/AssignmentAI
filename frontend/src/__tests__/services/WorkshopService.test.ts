import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWorkshopStore } from '../../services/WorkshopService';
import { api } from '../../services/api';

// Mock the API client
vi.mock('../../services/api', () => ({
  api: {
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('WorkshopService', () => {
  beforeEach(() => {
    useWorkshopStore.setState({
      prompt: '',
      generatedContent: '',
      isLoading: false,
      error: null,
      history: [],
      files: [],
      links: [],
    });
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const state = useWorkshopStore.getState();
    expect(state.prompt).toBe('');
    expect(state.generatedContent).toBe('');
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.history).toEqual([]);
    expect(state.files).toEqual([]);
    expect(state.links).toEqual([]);
  });

  it('should generate content', async () => {
    const mockPrompt = 'Test prompt';
    const mockResponse = { data: { content: 'Generated content' } };
    vi.mocked(api.post).mockResolvedValueOnce(mockResponse);

    const state = useWorkshopStore.getState();
    await state.generateContent(mockPrompt);

    const updatedState = useWorkshopStore.getState();
    expect(updatedState.generatedContent).toBe('Generated content');
    expect(updatedState.isLoading).toBe(false);
    expect(updatedState.error).toBeNull();
    expect(updatedState.history).toContainEqual(
      expect.objectContaining({
        prompt: mockPrompt,
        content: 'Generated content',
        timestamp: expect.any(String),
      })
    );
    expect(api.post).toHaveBeenCalledWith('/api/workshop/generate', expect.any(FormData));
  });

  it('should handle generation errors', async () => {
    const mockPrompt = 'Error prompt';
    vi.mocked(api.post).mockRejectedValueOnce(new Error('API Error'));

    const state = useWorkshopStore.getState();
    await state.generateContent(mockPrompt);

    const updatedState = useWorkshopStore.getState();
    expect(updatedState.generatedContent).toBe('');
    expect(updatedState.isLoading).toBe(false);
    expect(updatedState.error).toBe('Failed to generate content');
  });

  it('should save content', async () => {
    const mockContent = 'Content to save';
    vi.mocked(api.post).mockResolvedValueOnce({ data: {} });

    const state = useWorkshopStore.getState();
    await state.saveContent(mockContent);

    const updatedState = useWorkshopStore.getState();
    expect(updatedState.generatedContent).toBe(mockContent);
    expect(updatedState.isLoading).toBe(false);
    expect(updatedState.error).toBeNull();
    expect(api.post).toHaveBeenCalledWith('/api/workshop/save', { content: mockContent });
  });

  it('should add a file', async () => {
    const mockFile = new File(['test content'], 'test.txt', {
      type: 'text/plain',
    });
    const mockResponse = {
      data: {
        id: '1',
        name: 'test.txt',
        size: 12,
        type: 'text/plain',
      },
    };
    vi.mocked(api.post).mockResolvedValueOnce(mockResponse);

    const state = useWorkshopStore.getState();
    await state.addFile(mockFile);

    const updatedState = useWorkshopStore.getState();
    expect(updatedState.files).toEqual(
      expect.arrayContaining([expect.objectContaining(mockResponse.data)])
    );
    expect(updatedState.isLoading).toBe(false);
    expect(updatedState.error).toBeNull();
    expect(api.post).toHaveBeenCalledWith(
      '/api/workshop/files',
      expect.any(FormData),
      expect.objectContaining({
        headers: expect.any(Object),
        onUploadProgress: expect.any(Function),
      })
    );
  });

  it('should delete a file', async () => {
    const mockFile = {
      id: '1',
      name: 'test.txt',
      size: 12,
      type: 'text/plain',
    };
    vi.mocked(api.delete).mockResolvedValueOnce({ data: {} });

    useWorkshopStore.setState({
      files: [mockFile],
    });

    const state = useWorkshopStore.getState();
    await state.deleteFile('1');

    const updatedState = useWorkshopStore.getState();
    expect(updatedState.files).not.toContainEqual(mockFile);
    expect(updatedState.isLoading).toBe(false);
    expect(updatedState.error).toBeNull();
    expect(api.delete).toHaveBeenCalledWith('/api/workshop/files/1');
  });

  it('should add a link', async () => {
    const mockLink = {
      url: 'https://example.com',
      title: 'Example Link',
      description: 'Test description',
    };
    const mockResponse = {
      data: {
        id: '1',
        ...mockLink,
      },
    };
    vi.mocked(api.post).mockResolvedValueOnce(mockResponse);

    const state = useWorkshopStore.getState();
    await state.addLink(mockLink);

    const updatedState = useWorkshopStore.getState();
    expect(updatedState.links).toEqual(
      expect.arrayContaining([expect.objectContaining(mockResponse.data)])
    );
    expect(updatedState.isLoading).toBe(false);
    expect(updatedState.error).toBeNull();
    expect(api.post).toHaveBeenCalledWith('/api/workshop/links', expect.any(FormData));
  });

  it('should delete a link', async () => {
    const mockLink = {
      id: '1',
      url: 'https://example.com',
      title: 'Example Link',
      description: 'Test description',
    };
    vi.mocked(api.delete).mockResolvedValueOnce({ data: {} });

    useWorkshopStore.setState({
      links: [mockLink],
    });

    const state = useWorkshopStore.getState();
    await state.deleteLink('1');

    const updatedState = useWorkshopStore.getState();
    expect(updatedState.links).not.toContainEqual(mockLink);
    expect(updatedState.isLoading).toBe(false);
    expect(updatedState.error).toBeNull();
    expect(api.delete).toHaveBeenCalledWith('/api/workshop/links/1');
  });

  it('should delete a history item', async () => {
    const mockHistoryItem = {
      id: '1',
      prompt: 'Test prompt',
      content: 'Generated content',
      timestamp: new Date().toISOString(),
    };
    vi.mocked(api.delete).mockResolvedValueOnce({ data: {} });

    useWorkshopStore.setState({
      history: [mockHistoryItem],
    });

    const state = useWorkshopStore.getState();
    await state.deleteHistoryItem('1');

    const updatedState = useWorkshopStore.getState();
    expect(updatedState.history).not.toContainEqual(mockHistoryItem);
    expect(updatedState.isLoading).toBe(false);
    expect(updatedState.error).toBeNull();
    expect(api.delete).toHaveBeenCalledWith('/api/workshop/history/1');
  });

  it('should clear workshop state', () => {
    useWorkshopStore.setState({
      prompt: 'Test prompt',
      generatedContent: 'Generated content',
      history: [
        {
          id: '1',
          prompt: 'Test prompt',
          content: 'Generated content',
          timestamp: new Date().toISOString(),
        },
      ],
      files: [
        {
          id: '1',
          name: 'test.txt',
          size: 12,
          type: 'text/plain',
        },
      ],
      links: [
        {
          id: '1',
          url: 'https://example.com',
          title: 'Example Link',
          description: 'Test description',
        },
      ],
    });

    const state = useWorkshopStore.getState();
    state.clearWorkshop();

    const updatedState = useWorkshopStore.getState();
    expect(updatedState.prompt).toBe('');
    expect(updatedState.generatedContent).toBe('');
    expect(updatedState.isLoading).toBe(false);
    expect(updatedState.error).toBeNull();
    expect(updatedState.history).toEqual([]);
    expect(updatedState.files).toEqual([]);
    expect(updatedState.links).toEqual([]);
  });
});
