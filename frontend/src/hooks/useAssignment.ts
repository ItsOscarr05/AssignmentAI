import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';

export const useAssignment = (assignmentId?: string) => {
  const api = useApi();

  return useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => {
      if (!assignmentId) return null;
      return api.get(`/assignments/${assignmentId}`);
    },
    enabled: !!assignmentId,
  });
};
