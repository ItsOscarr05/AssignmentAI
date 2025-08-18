import { api } from './api';

export interface PaymentMethod {
  id: string;
  type: 'card';
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

export interface Subscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  plan_id: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  token_limit?: number;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  priceId: string;
  color: string;
}

export interface PlanWithStatus extends Plan {
  isCurrentPlan: boolean;
  status: 'current' | 'available';
  color: string;
}

class PaymentService {
  async getPlans(): Promise<Plan[]> {
    const response = await api.get<Plan[]>('/plans');
    return response.data;
  }

  async getPlansWithStatus(): Promise<PlanWithStatus[]> {
    // Check if we're in mock user mode
    // Test endpoints are disabled since test users are removed
    const endpoint = '/payments/plans/with-status';
    const response = await api.get<PlanWithStatus[]>(endpoint);
    return response.data;
  }

  async getCurrentPlan(): Promise<Plan> {
    const response = await api.get<Plan>('/plans/current');
    return response.data;
  }

  async getCurrentSubscription(): Promise<Subscription> {
    // Check if we're in mock user mode
    // Test endpoints are disabled since test users are removed
    const endpoint = '/payments/subscriptions/current';
    const response = await api.get<Subscription>(endpoint);
    return response.data;
  }

  async createSubscription(
    planId: string,
    paymentMethod: {
      card_number: string;
      expiry_date: string;
      cvc: string;
      name: string;
    }
  ): Promise<Subscription> {
    const response = await api.post<Subscription>('/subscriptions/create', {
      plan_id: planId,
      payment_method: paymentMethod,
    });
    return response.data;
  }

  async cancelSubscription(): Promise<void> {
    await api.post('/subscriptions/cancel');
  }

  async updatePaymentMethod(paymentMethod: {
    card_number: string;
    expiry_date: string;
    cvc: string;
    name: string;
  }): Promise<PaymentMethod> {
    const response = await api.post<PaymentMethod>('/payment-methods/update', {
      payment_method: paymentMethod,
    });
    return response.data;
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const response = await api.get<PaymentMethod[]>('/payment-methods');
    return response.data;
  }

  async deletePaymentMethod(paymentMethodId: string): Promise<void> {
    await api.delete(`/payment-methods/${paymentMethodId}`);
  }
}

export const paymentService = new PaymentService();
