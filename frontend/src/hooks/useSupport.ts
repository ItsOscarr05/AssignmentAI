import { useCallback, useEffect, useState } from 'react';

interface SupportTicket {
  id: number;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: string;
  createdAt: string;
  updatedAt: string;
}

interface UseSupportReturn {
  tickets: SupportTicket[];
  loading: boolean;
  error: string | null;
  createTicket: (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTicket: (id: number, ticket: Partial<SupportTicket>) => Promise<void>;
  refreshTickets: () => Promise<void>;
}

export const useSupport = (): UseSupportReturn => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Mock API call - replace with actual API call
      const mockTickets: SupportTicket[] = [
        {
          id: 1,
          title: 'Technical Issue',
          description: 'Having trouble with the platform',
          priority: 'high',
          status: 'open',
          category: 'technical',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
        {
          id: 2,
          title: 'Billing Question',
          description: 'Need help with subscription',
          priority: 'medium',
          status: 'in_progress',
          category: 'billing',
          createdAt: '2024-01-14T09:00:00Z',
          updatedAt: '2024-01-14T09:00:00Z',
        },
      ];
      setTickets(mockTickets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch support tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  const createTicket = useCallback(
    async (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>) => {
      setLoading(true);
      setError(null);
      try {
        // Mock API call - replace with actual API call
        const newTicket: SupportTicket = {
          ...ticket,
          id: Date.now(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setTickets(prev => [...prev, newTicket]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create support ticket');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateTicket = useCallback(async (id: number, ticket: Partial<SupportTicket>) => {
    setLoading(true);
    setError(null);
    try {
      // Mock API call - replace with actual API call
      setTickets(prev =>
        prev.map(t => (t.id === id ? { ...t, ...ticket, updatedAt: new Date().toISOString() } : t))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update support ticket');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshTickets = useCallback(async () => {
    await fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return {
    tickets,
    loading,
    error,
    createTicket,
    updateTicket,
    refreshTickets,
  };
};
