import api from '../config/api';

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

class ContactService {
  async submitContactForm(data: ContactFormData): Promise<{ message: string }> {
    const response = await api.post('/contact/contact', data);
    return response.data;
  }
}

export const contactService = new ContactService();
