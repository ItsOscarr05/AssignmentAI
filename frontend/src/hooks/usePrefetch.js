import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

export const usePrefetch = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const prefetchAssignment = useCallback(
    async (id) => {
      // Prefetch single assignment
      await queryClient.prefetchQuery({
        queryKey: ["assignments", id],
        queryFn: async () => {
          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/assignments/${id}`,
            {
              headers: { Authorization: `Bearer ${user.token}` },
            }
          );
          return response.data;
        },
        staleTime: 30000, // Consider data fresh for 30 seconds
      });
    },
    [queryClient, user]
  );

  const prefetchAssignments = useCallback(
    async (filters = {}) => {
      // Prefetch assignments list
      await queryClient.prefetchQuery({
        queryKey: ["assignments", filters],
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
        staleTime: 30000, // Consider data fresh for 30 seconds
      });
    },
    [queryClient, user]
  );

  const prefetchNextPage = useCallback(
    async (pageParam, filters = {}) => {
      // Prefetch next page for infinite scroll
      await queryClient.prefetchInfiniteQuery({
        queryKey: ["assignments", "infinite", filters],
        queryFn: async () => {
          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/assignments`,
            {
              params: {
                ...filters,
                page: pageParam,
                limit: 10,
              },
              headers: { Authorization: `Bearer ${user.token}` },
            }
          );
          return response.data;
        },
        staleTime: 30000, // Consider data fresh for 30 seconds
      });
    },
    [queryClient, user]
  );

  const backgroundUpdate = useCallback(
    async (queryKey) => {
      // Trigger a background update
      await queryClient.invalidateQueries({
        queryKey,
        refetchType: "active",
        exact: false,
      });
    },
    [queryClient]
  );

  return {
    prefetchAssignment,
    prefetchAssignments,
    prefetchNextPage,
    backgroundUpdate,
  };
};
