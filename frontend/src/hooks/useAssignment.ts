import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export const useAssignment = (assignmentId?: string) => {
  return useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: async () => {
      if (!assignmentId) return null;
      const response = await axios.get(`/assignments/${assignmentId}`);
      return response.data;
    },
    enabled: !!assignmentId,
  });
};
