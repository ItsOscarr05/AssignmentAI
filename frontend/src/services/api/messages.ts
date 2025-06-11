import { Conversation, Message } from '../../types/messages';
import { api } from './api';

export const messagesApi = {
  async getConversations(): Promise<Conversation[]> {
    const response = await api.get('/messages/conversations');
    return response.data;
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const response = await api.get(`/messages/conversations/${conversationId}`);
    return response.data;
  },

  async sendMessage(data: {
    conversationId: string;
    content: string;
    attachments?: File[];
  }): Promise<void> {
    const formData = new FormData();
    formData.append('content', data.content);
    if (data.attachments) {
      data.attachments.forEach(file => {
        formData.append('attachments', file);
      });
    }
    await api.post(`/messages/conversations/${data.conversationId}`, formData);
  },

  async deleteConversation(conversationId: string): Promise<void> {
    await api.delete(`/messages/conversations/${conversationId}`);
  },
};
