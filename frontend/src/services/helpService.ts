import { api } from './api';

export interface ContactFormData {
  email: string;
  subject: string;
  message: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface HelpSearchResult {
  articles: HelpArticle[];
  total: number;
  query: string;
}

class HelpService {
  async submitContactForm(data: ContactFormData): Promise<void> {
    await api.post('/help/contact', data);
  }

  async searchHelpArticles(query: string): Promise<HelpSearchResult> {
    const response = await api.get<HelpSearchResult>('/help/search', {
      params: { q: query },
    });
    return response.data;
  }

  async getHelpCategories(): Promise<string[]> {
    const response = await api.get<string[]>('/help/categories');
    return response.data;
  }

  async getPopularArticles(): Promise<HelpArticle[]> {
    const response = await api.get<HelpArticle[]>('/help/popular');
    return response.data;
  }

  async getArticleById(id: string): Promise<HelpArticle> {
    const response = await api.get<HelpArticle>(`/help/articles/${id}`);
    return response.data;
  }

  async submitFeedback(articleId: string, helpful: boolean, comment?: string): Promise<void> {
    await api.post('/help/feedback', {
      articleId,
      helpful,
      comment,
    });
  }
}

export const helpService = new HelpService();
