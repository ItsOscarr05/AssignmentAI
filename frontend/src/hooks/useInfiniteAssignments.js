import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

const ASSIGNMENTS_KEY = "assignments";
const PAGE_SIZE = 10;

export const useInfiniteAssignments = (filters = {}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch assignments with infinite scrolling
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: [ASSIGNMENTS_KEY, "infinite", filters],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/assignments`,
        {
          params: {
            ...filters,
            page: pageParam,
            limit: PAGE_SIZE,
          },
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      return response.data;
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === PAGE_SIZE ? allPages.length + 1 : undefined;
    },
    getPreviousPageParam: (firstPage, allPages) => {
      return allPages.length > 1 ? allPages.length - 1 : undefined;
    },
  });

  // Create assignment with optimistic update
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
    onMutate: async (newAssignment) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: [ASSIGNMENTS_KEY] });

      // Snapshot previous value
      const previousAssignments = queryClient.getQueryData([ASSIGNMENTS_KEY]);

      // Optimistically update
      queryClient.setQueryData([ASSIGNMENTS_KEY], (old) => ({
        pages: [
          [{ id: "temp-id", ...newAssignment }, ...(old?.pages[0] || [])],
          ...(old?.pages.slice(1) || []),
        ],
        pageParams: old?.pageParams || [],
      }));

      return { previousAssignments };
    },
    onError: (err, newAssignment, context) => {
      queryClient.setQueryData([ASSIGNMENTS_KEY], context.previousAssignments);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [ASSIGNMENTS_KEY] });
    },
  });

  // Update assignment with optimistic update
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
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: [ASSIGNMENTS_KEY] });
      const previousAssignments = queryClient.getQueryData([ASSIGNMENTS_KEY]);

      queryClient.setQueryData([ASSIGNMENTS_KEY], (old) => ({
        pages: old.pages.map((page) =>
          page.map((assignment) =>
            assignment.id === id ? { ...assignment, ...updates } : assignment
          )
        ),
        pageParams: old.pageParams,
      }));

      return { previousAssignments };
    },
    onError: (err, { id }, context) => {
      queryClient.setQueryData([ASSIGNMENTS_KEY], context.previousAssignments);
    },
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: [ASSIGNMENTS_KEY] });
    },
  });

  // Delete assignment with optimistic update
  const deleteAssignment = useMutation({
    mutationFn: async (id) => {
      await axios.delete(`${process.env.REACT_APP_API_URL}/assignments/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [ASSIGNMENTS_KEY] });
      const previousAssignments = queryClient.getQueryData([ASSIGNMENTS_KEY]);

      queryClient.setQueryData([ASSIGNMENTS_KEY], (old) => ({
        pages: old.pages.map((page) =>
          page.filter((assignment) => assignment.id !== id)
        ),
        pageParams: old.pageParams,
      }));

      return { previousAssignments };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData([ASSIGNMENTS_KEY], context.previousAssignments);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [ASSIGNMENTS_KEY] });
    },
  });

  // Transform the infinite query data into a flat array
  const assignments = data?.pages.flatMap((page) => page) ?? [];

  return {
    assignments,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    createAssignment,
    updateAssignment,
    deleteAssignment,
  };
};
