import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

const ASSIGNMENTS_KEY = "assignments";

export const useAssignments = (filters = {}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch assignments list
  const {
    data: assignments,
    isLoading,
    error,
  } = useQuery({
    queryKey: [ASSIGNMENTS_KEY, filters],
    queryFn: async () => {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/assignments`,
        {
          params: filters,
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      return response.data;
    },
  });

  // Create new assignment
  const createAssignment = useMutation({
    mutationFn: async (newAssignment) => {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/assignments`,
        newAssignment,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch assignments queries
      queryClient.invalidateQueries({ queryKey: [ASSIGNMENTS_KEY] });
    },
  });

  // Update assignment
  const updateAssignment = useMutation({
    mutationFn: async ({ id, ...data }) => {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/assignments/${id}`,
        data,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [ASSIGNMENTS_KEY] });
      queryClient.invalidateQueries({
        queryKey: [ASSIGNMENTS_KEY, variables.id],
      });
    },
  });

  // Delete assignment
  const deleteAssignment = useMutation({
    mutationFn: async (id) => {
      await axios.delete(`${process.env.REACT_APP_API_URL}/assignments/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ASSIGNMENTS_KEY] });
    },
  });

  return {
    assignments,
    isLoading,
    error,
    createAssignment,
    updateAssignment,
    deleteAssignment,
  };
};
