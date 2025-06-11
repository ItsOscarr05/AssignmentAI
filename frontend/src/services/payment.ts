import { api } from './api';


export interface SubscriptionResponse {
  subscription_id: string;
  client_secret: string;
}

export interface CancelSubscriptionResponse {
  message: string;
}

export const payment = {
  createSubscription: async (
    priceId: string,
    paymentMethodId?: string
  ): Promise<SubscriptionResponse> => {
    const response = await api.post<SubscriptionResponse>('/payments/create-subscription', {
      price_id: priceId,
      payment_method_id: paymentMethodId,
    });
    return response.data;
  },

  cancelSubscription: async (): Promise<CancelSubscriptionResponse> => {
    const response = await api.post<CancelSubscriptionResponse>('/payments/cancel-subscription');
    return response.data;
  },
};
