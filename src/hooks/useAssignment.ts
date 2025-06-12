import { useEffect } from 'react';
import { useApi } from './useApi';

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

export function useAssignment(id?: string) {
  const { data, error, loading, request } = useApi<Assignment>();

  useEffect(() => {
    if (id) {
      request(`/api/assignments/${id}`);
    }
  }, [id, request]);

  return {
    assignment: data,
    error,
    loading,
  };
}
